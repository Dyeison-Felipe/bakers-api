import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CustomerSchema } from './database/typeorm/schema/customer.schema';
import { CustomerRepositoryImpl } from './database/typeorm/repository/customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerSchema])],
  providers: [
    {
      provide: PROVIDERS.CUSTOMER_REPOSITORY,
      useClass: CustomerRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.CUSTOMER_REPOSITORY],
})
export class CustomerPersistenceModule {}
