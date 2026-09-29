import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanyModule } from '@/core/company/infra/company.module';
import { PlanModule } from '@/core/plan/infra/plan.module';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { MailService } from '@/shared/application/mail/mail.service';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SubscriptionPersistenceModule } from './subscription-persistence.module';
import { CompanySubscriptionRepository } from '../domain/repositories/company-subscription.repository';
import { PaymentRepository } from '../domain/repositories/payment.repository';
import { ConfirmSubscriptionPaymentUseCase } from '../application/usecase/confirm-subscription-payment.usecase';
import { FindCompanySubscriptionUseCase } from '../application/usecase/find-company-subscription.usecase';
import { SubscribePlanUseCase } from '../application/usecase/subscribe-plan.usecase';
import { CancelSubscriptionUseCase } from '../application/usecase/cancel-subscription.usecase';
import { ResumeSubscriptionUseCase } from '../application/usecase/resume-subscription.usecase';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionReconciliationJob } from './jobs/subscription-reconciliation.job';

@Module({
  imports: [CompanyModule, PlanModule, SubscriptionPersistenceModule],
  controllers: [StripeWebhookController, SubscriptionController],
  providers: [
    {
      provide: ConfirmSubscriptionPaymentUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        paymentRepository: PaymentRepository,
        companyRepository: CompanyRepository,
        userRepository: UserRepository,
        mailService: MailService,
      ) =>
        new ConfirmSubscriptionPaymentUseCase(
          companySubscriptionRepository,
          paymentRepository,
          companyRepository,
          userRepository,
          mailService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.PAYMENT_REPOSITORY,
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.MAIL_SERVICE,
      ],
    },
    {
      provide: FindCompanySubscriptionUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        companyRepository: CompanyRepository,
        stripeService: StripeService,
        loggedUserService: LoggedUserService,
      ) =>
        new FindCompanySubscriptionUseCase(
          companySubscriptionRepository,
          companyRepository,
          stripeService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.STRIPE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: SubscribePlanUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        companyRepository: CompanyRepository,
        planRepository: PlanRepository,
        stripeService: StripeService,
        loggedUserService: LoggedUserService,
      ) =>
        new SubscribePlanUseCase(
          companySubscriptionRepository,
          companyRepository,
          planRepository,
          stripeService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.PLAN_REPOSITORY,
        PROVIDERS.STRIPE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CancelSubscriptionUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        companyRepository: CompanyRepository,
        stripeService: StripeService,
        loggedUserService: LoggedUserService,
      ) =>
        new CancelSubscriptionUseCase(
          companySubscriptionRepository,
          companyRepository,
          stripeService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.STRIPE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: ResumeSubscriptionUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        companyRepository: CompanyRepository,
        stripeService: StripeService,
        loggedUserService: LoggedUserService,
      ) =>
        new ResumeSubscriptionUseCase(
          companySubscriptionRepository,
          companyRepository,
          stripeService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.STRIPE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: SubscriptionReconciliationJob,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        stripeService: StripeService,
        confirmSubscriptionPaymentUseCase: ConfirmSubscriptionPaymentUseCase,
      ) =>
        new SubscriptionReconciliationJob(
          companySubscriptionRepository,
          stripeService,
          confirmSubscriptionPaymentUseCase,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.STRIPE_SERVICE,
        ConfirmSubscriptionPaymentUseCase,
      ],
    },
  ],
  exports: [],
})
export class SubscriptionModule {}
