import { Inject, Logger } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { getErrorStack } from '@/shared/application/helpers/error.helper';
import { CompanySubscriptionOutput } from '@/shared/application/output/subscription/company-subscription.output';

type Input = void;

type Output = CompanySubscriptionOutput;

// Situação do plano/assinatura da empresa do usuário logado — alimenta a
// seção "Assinatura" das configurações e a tela de assinar um plano (que
// consulta isto repetidamente enquanto espera o pagamento ser confirmado).
export class FindCompanySubscriptionUseCase implements UseCase<Input, Output> {
  private readonly logger = new Logger(FindCompanySubscriptionUseCase.name);

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

    const company = await this.companyRepository.findById(
      loggedUser.company.id,
    );

    if (!company) {
      throw new NotFoundError(`Empresa não encontrada`);
    }

    const subscription =
      await this.companySubscriptionRepository.findLatestByCompanyId(
        company.id,
      );

    const hasRunningPeriod =
      subscription?.status === 'active' || subscription?.status === 'cancelled';

    return {
      plan: {
        id: company.plan?.id ?? '',
        name: company.plan?.name ?? '',
        price: company.plan?.price ?? 0,
      },
      planExpiresAt: company.planExpiresAt,
      planExpired:
        !company.active || company.planExpiresAt.getTime() < Date.now(),
      subscription: subscription
        ? {
            status: subscription.status,
            planName: subscription.plan.name,
            cardBrand: subscription.cardBrand ?? null,
            cardLastFourDigits: subscription.cardLastFourDigits ?? null,
            currentPeriodEnd: hasRunningPeriod
              ? await this.findCurrentPeriodEnd(
                  subscription.stripeSubscriptionId,
                )
              : null,
          }
        : null,
    };
  }

  // Data da próxima cobrança (ou do fim do acesso, se cancelada). É só
  // informativa: se o Stripe não responder, a tela só não mostra a data.
  private async findCurrentPeriodEnd(
    stripeSubscriptionId: string,
  ): Promise<Date | null> {
    try {
      const snapshot =
        await this.stripeService.getSubscription(stripeSubscriptionId);
      return snapshot.currentPeriodEnd;
    } catch (error) {
      this.logger.warn(
        `Não foi possível consultar a assinatura ${stripeSubscriptionId} no Stripe`,
        getErrorStack(error),
      );
      return null;
    }
  }
}
