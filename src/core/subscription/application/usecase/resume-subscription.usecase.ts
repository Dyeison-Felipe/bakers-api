import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { Company } from '@/core/company/domain/entities/company.entity';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';

type Input = void;

type Output = void;

// Desfaz um cancelamento enquanto o período pago ainda está valendo: a
// cobrança recorrente volta a acontecer e o acesso volta a ter a folga de
// renovação. Depois que o período acaba, o Stripe encerra a assinatura de
// vez — aí o caminho é assinar de novo (SubscribePlanUseCase).
export class ResumeSubscriptionUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const companySubscription =
      await this.companySubscriptionRepository.findLatestByCompanyId(
        loggedUser.company.id,
      );

    if (!companySubscription || companySubscription.status !== 'cancelled') {
      throw new NotFoundError(`Nenhuma assinatura cancelada para reativar`);
    }

    const current = await this.stripeService.getSubscription(
      companySubscription.stripeSubscriptionId,
    );

    if (current.status !== 'active' && current.status !== 'trialing') {
      throw new BadRequestError(
        `Esta assinatura já foi encerrada. Assine um plano novamente para continuar.`,
      );
    }

    const stripeSubscription = await this.stripeService.resumeSubscription(
      companySubscription.stripeSubscriptionId,
    );

    companySubscription.resume();
    await this.companySubscriptionRepository.update(companySubscription);

    if (stripeSubscription.currentPeriodEnd) {
      const company = companySubscription.company;
      company.setPlanExpiresAt(
        Company.subscriptionAccessUntil(stripeSubscription.currentPeriodEnd),
        loggedUser.id,
      );
      await this.companyRepository.update(company);
    }
  }
}
