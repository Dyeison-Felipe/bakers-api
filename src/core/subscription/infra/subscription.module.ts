import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanyModule } from '@/core/company/infra/company.module';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { MailService } from '@/shared/application/mail/mail.service';
import { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SubscriptionPersistenceModule } from './subscription-persistence.module';
import { CompanySubscriptionRepository } from '../domain/repositories/company-subscription.repository';
import { PaymentRepository } from '../domain/repositories/payment.repository';
import { ConfirmSubscriptionPaymentUseCase } from '../application/usecase/confirm-subscription-payment.usecase';
import { CancelSubscriptionUseCase } from '../application/usecase/cancel-subscription.usecase';
import { MercadoPagoWebhookController } from './controllers/mercado-pago-webhook.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionReconciliationJob } from './jobs/subscription-reconciliation.job';

@Module({
  imports: [CompanyModule, SubscriptionPersistenceModule],
  controllers: [MercadoPagoWebhookController, SubscriptionController],
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
      provide: CancelSubscriptionUseCase,
      useFactory: (
        companySubscriptionRepository: CompanySubscriptionRepository,
        mercadoPagoService: MercadoPagoService,
        loggedUserService: LoggedUserService,
      ) =>
        new CancelSubscriptionUseCase(
          companySubscriptionRepository,
          mercadoPagoService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
        PROVIDERS.MERCADO_PAGO_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    SubscriptionReconciliationJob,
  ],
  exports: [],
})
export class SubscriptionModule {}
