import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CashRegisterSessionSchema } from './database/typeorm/schema/cash-register-session.schema';
import { CashRegisterSessionRepositoryImpl } from './database/typeorm/repository/cash-register-session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegisterSessionSchema])],
  providers: [
    {
      provide: PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
      useClass: CashRegisterSessionRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY],
})
export class CashRegisterPersistenceModule {}
