import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';

type Input = {
  planId: string;
  // Id do PaymentMethod já confirmado no navegador (Stripe Payment Element +
  // SetupIntent) — nunca recebemos dados de cartão em texto puro aqui.
  stripePaymentMethodId: string;
};

type Output = void;

// Assinatura de um plano pago feita de dentro do sistema: empresa com o plano
// vencido (o Admin consegue logar só pra isso) ou no plano gratuito querendo
// passar pra um pago. Mesmo fluxo de cobrança do cadastro: a empresa só muda
// de plano/é liberada quando o webhook confirmar a 1ª cobrança
// (ConfirmSubscriptionPaymentUseCase); o front acompanha pelo
// FindCompanySubscriptionUseCase.
export class SubscribePlanUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const company = await this.companyRepository.findById(
      loggedUser.company.id,
    );

    if (!company) {
      throw new NotFoundError(`Empresa não encontrada`);
    }

    const plan = await this.planRepository.findById(input.planId);

    if (!plan || !plan.active) {
      throw new NotFoundError(`Plano não encontrado`);
    }

    // Plano gratuito não se contrata de novo por aqui — senão bastaria
    // renová-lo pra sempre.
    if (plan.price <= 0) {
      throw new BadRequestError(`Escolha um plano pago para continuar`);
    }

    if (!plan.stripePriceId) {
      throw new BadRequestError(
        `Este plano está indisponível para contratação no momento`,
      );
    }

    const latest =
      await this.companySubscriptionRepository.findLatestByCompanyId(
        company.id,
      );

    if (latest?.status === 'pending') {
      throw new ConflictError(
        `Já existe um pagamento em processamento. Aguarde a confirmação.`,
      );
    }

    if (latest?.status === 'active') {
      throw new ConflictError(`Sua empresa já possui uma assinatura ativa`);
    }

    const planStillValid =
      company.active && company.planExpiresAt.getTime() > Date.now();

    if (latest?.status === 'cancelled' && planStillValid) {
      throw new ConflictError(
        `Sua assinatura cancelada ainda está valendo. Reative-a nas configurações da empresa.`,
      );
    }

    // Reaproveita o customer de uma assinatura anterior (mantém o histórico
    // de cobranças da empresa num lugar só no Stripe).
    const stripeCustomerId =
      latest?.stripeCustomerId ??
      (await this.stripeService.createCustomer(
        company.email,
        company.fantasyName,
      ));

    await this.stripeService.attachPaymentMethod(
      stripeCustomerId,
      input.stripePaymentMethodId,
    );

    const cardDetails =
      await this.stripeService.retrievePaymentMethodCardDetails(
        input.stripePaymentMethodId,
      );

    const stripeSubscription = await this.stripeService.createSubscription({
      customerId: stripeCustomerId,
      priceId: plan.stripePriceId,
      paymentMethodId: input.stripePaymentMethodId,
    });

    const companySubscription = CompanySubscription.create({
      company,
      plan,
      stripeSubscriptionId: stripeSubscription.subscriptionId,
      stripeCustomerId,
      origin: 'renewal',
      payerEmail: loggedUser.email,
      cardLastFourDigits: cardDetails.last4,
      cardBrand: cardDetails.brand,
    });

    // Salva antes de cobrar: o webhook da cobrança pode chegar logo em
    // seguida e precisa encontrar a assinatura.
    await this.companySubscriptionRepository.save(companySubscription);

    if (stripeSubscription.latestInvoiceId) {
      await this.stripeService.confirmInvoicePayment(
        stripeSubscription.latestInvoiceId,
        input.stripePaymentMethodId,
      );
    }
  }
}
