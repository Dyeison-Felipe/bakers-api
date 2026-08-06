import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SalePersistenceModule } from '@/core/sale/infra/sale-persistence.module';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionPersistenceModule } from '@/core/daily-production/infra/daily-production-persistence.module';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpensePersistenceModule } from '@/core/expense/infra/expense-persistence.module';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { BatchPersistenceModule } from '@/core/batch/infra/batch-persistence.module';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { CashRegisterPersistenceModule } from './cash-register-persistence.module';
import { CashRegisterSessionRepository } from '../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../domain/repositories/cash-register-movement.repository';
import { CashRegisterController } from './controllers/cash-register.controller';
import { OpenCashRegisterSessionUseCase } from '../application/usecase/open-cash-register-session.usecase';
import { FindOpenCashRegisterSessionUseCase } from '../application/usecase/find-open-cash-register-session.usecase';
import { CloseCashRegisterSessionUseCase } from '../application/usecase/close-cash-register-session.usecase';
import { FindAllCashRegisterSessionsUseCase } from '../application/usecase/find-all-cash-register-sessions.usecase';
import { FindCashRegisterSessionDetailUseCase } from '../application/usecase/find-cash-register-session-detail.usecase';
import { CreateCashRegisterMovementUseCase } from '../application/usecase/create-cash-register-movement.usecase';
import { FindCashRegisterMovementsUseCase } from '../application/usecase/find-cash-register-movements.usecase';

@Module({
  imports: [
    CashRegisterPersistenceModule,
    SalePersistenceModule,
    DailyProductionPersistenceModule,
    ExpensePersistenceModule,
    BatchPersistenceModule,
  ],
  controllers: [CashRegisterController],
  providers: [
    {
      provide: OpenCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new OpenCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindOpenCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindOpenCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CloseCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        saleRepository: SaleRepository,
        cashRegisterMovementRepository: CashRegisterMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new CloseCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          saleRepository,
          cashRegisterMovementRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindAllCashRegisterSessionsUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindAllCashRegisterSessionsUseCase(
          cashRegisterSessionRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindCashRegisterSessionDetailUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        saleItemRepository: SaleItemRepository,
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        expenseRepository: ExpenseRepository,
        batchMovementRepository: BatchMovementRepository,
        cashRegisterMovementRepository: CashRegisterMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindCashRegisterSessionDetailUseCase(
          cashRegisterSessionRepository,
          saleItemRepository,
          dailyProductionRepository,
          dailyProductionItemRepository,
          expenseRepository,
          batchMovementRepository,
          cashRegisterMovementRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.SALE_ITEM_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.EXPENSE_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CreateCashRegisterMovementUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        cashRegisterMovementRepository: CashRegisterMovementRepository,
        saleRepository: SaleRepository,
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new CreateCashRegisterMovementUseCase(
          cashRegisterSessionRepository,
          cashRegisterMovementRepository,
          saleRepository,
          expenseRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.EXPENSE_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindCashRegisterMovementsUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        cashRegisterMovementRepository: CashRegisterMovementRepository,
      ) =>
        new FindCashRegisterMovementsUseCase(
          cashRegisterSessionRepository,
          cashRegisterMovementRepository,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY,
      ],
    },
  ],
  exports: [],
})
export class CashRegisterModule {}
