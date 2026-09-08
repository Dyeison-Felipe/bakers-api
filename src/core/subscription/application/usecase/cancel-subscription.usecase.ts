import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';

type Input = void;

type Output = void;

// Self-service: o próprio Admin da empresa cancela — nunca mexe em
// company.active/planExpiresAt. A empresa segue funcionando normalmente
// até a data já paga; o PlanExpirationJob (já existente) desativa quando
// vencer, e o Stripe simplesmente não tenta cobrar de novo
// (cancel_at_period_end).
export class CancelSubscriptionUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const companySubscription =
      await this.companySubscriptionRepository.findActiveByCompanyId(
        loggedUser.company.id,
      );

    if (!companySubscription) {
      throw new NotFoundError(`Nenhuma assinatura ativa encontrada`);
    }

    await this.stripeService.cancelSubscriptionAtPeriodEnd(
      companySubscription.stripeSubscriptionId,
    );

    companySubscription.cancel();
    await this.companySubscriptionRepository.update(companySubscription);
  }
}
