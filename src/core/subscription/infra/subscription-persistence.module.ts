import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanySubscriptionSchema } from './database/typeorm/schema/company-subscription.schema';
import { PaymentSchema } from './database/typeorm/schema/payment.schema';
import { CompanySubscriptionRepositoryImpl } from './database/typeorm/repository/company-subscription.repository';
import { PaymentRepositoryImpl } from './database/typeorm/repository/payment.repository';

// Módulo leve, só de persistência — existe pra CompanyModule poder usar
// CompanySubscriptionRepository (na criação otimista da assinatura) sem
// depender do SubscriptionModule inteiro (que por sua vez depende de
// CompanyModule), evitando import circular entre os dois.
@Module({
  imports: [TypeOrmModule.forFeature([CompanySubscriptionSchema, PaymentSchema])],
  providers: [
    {
      provide: PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
      useClass: CompanySubscriptionRepositoryImpl,
    },
    {
      provide: PROVIDERS.PAYMENT_REPOSITORY,
      useClass: PaymentRepositoryImpl,
    },
  ],
  exports: [
    PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY,
    PROVIDERS.PAYMENT_REPOSITORY,
  ],
})
export class SubscriptionPersistenceModule {}
