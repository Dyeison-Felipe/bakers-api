import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CashRegisterSessionSchema } from './database/typeorm/schema/cash-register-session.schema';
import { CashRegisterMovementSchema } from './database/typeorm/schema/cash-register-movement.schema';
import { CashRegisterSessionRepositoryImpl } from './database/typeorm/repository/cash-register-session.repository';
import { CashRegisterMovementRepositoryImpl } from './database/typeorm/repository/cash-register-movement.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashRegisterSessionSchema,
      CashRegisterMovementSchema,
    ]),
  ],
  providers: [
    {
      provide: PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
      useClass: CashRegisterSessionRepositoryImpl,
    },
    {
      provide: PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
      useClass: CashRegisterMovementRepositoryImpl,
    },
  ],
  exports: [
    PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
    PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
  ],
})
export class CashRegisterPersistenceModule {}
