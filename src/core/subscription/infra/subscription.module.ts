import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanyModule } from '@/core/company/infra/company.module';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { MailService } from '@/shared/application/mail/mail.service';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { SubscriptionPersistenceModule } from './subscription-persistence.module';
import { CompanySubscriptionRepository } from '../domain/repositories/company-subscription.repository';
import { PaymentRepository } from '../domain/repositories/payment.repository';
import { ConfirmSubscriptionPaymentUseCase } from '../application/usecase/confirm-subscription-payment.usecase';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { SubscriptionReconciliationJob } from './jobs/subscription-reconciliation.job';

@Module({
  imports: [CompanyModule, SubscriptionPersistenceModule],
  controllers: [StripeWebhookController],
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
