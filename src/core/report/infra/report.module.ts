import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { BatchPersistenceModule } from '@/core/batch/infra/batch-persistence.module';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { CashRegisterModule } from '@/core/cash-register/infra/cash-register.module';
import { CashRegisterPersistenceModule } from '@/core/cash-register/infra/cash-register-persistence.module';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { FindCashRegisterSessionDetailUseCase } from '@/core/cash-register/application/usecase/find-cash-register-session-detail.usecase';
import { DailyProductionPersistenceModule } from '@/core/daily-production/infra/daily-production-persistence.module';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpensePersistenceModule } from '@/core/expense/infra/expense-persistence.module';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { SalePersistenceModule } from '@/core/sale/infra/sale-persistence.module';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { ReportController } from './controller/report.controller';
import { FindWasteReportUseCase } from '../application/usecase/find-waste-report.usecase';
import { FindCashRegisterReportUseCase } from '../application/usecase/find-cash-register-report.usecase';
import { FindProductionReportUseCase } from '../application/usecase/find-production-report.usecase';
import { FindExpenseReportUseCase } from '../application/usecase/find-expense-report.usecase';
import { FindDailyRevenueSeriesUseCase } from '../application/usecase/find-daily-revenue-series.usecase';
import { FindCostComparisonSeriesUseCase } from '../application/usecase/find-cost-comparison-series.usecase';
import { FindPaymentMethodBreakdownUseCase } from '../application/usecase/find-payment-method-breakdown.usecase';
import { FindTopWastedProductsUseCase } from '../application/usecase/find-top-wasted-products.usecase';
import { GenerateWasteReportPdfUseCase } from '../application/usecase/generate-waste-report-pdf.usecase';
import { GenerateCashRegisterReportPdfUseCase } from '../application/usecase/generate-cash-register-report-pdf.usecase';
import { GenerateProductionReportPdfUseCase } from '../application/usecase/generate-production-report-pdf.usecase';
import { GenerateExpenseReportPdfUseCase } from '../application/usecase/generate-expense-report-pdf.usecase';

@Module({
  imports: [
    BatchPersistenceModule,
    CashRegisterModule,
    CashRegisterPersistenceModule,
    DailyProductionPersistenceModule,
    ExpensePersistenceModule,
    SalePersistenceModule,
  ],
  controllers: [ReportController],
  providers: [
    {
      provide: FindWasteReportUseCase,
      useFactory: (
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
      ) => new FindWasteReportUseCase(batchMovementRepository, loggedUserService),
      inject: [PROVIDERS.BATCH_MOVEMENT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindCashRegisterReportUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        findCashRegisterSessionDetailUseCase: FindCashRegisterSessionDetailUseCase,
        loggedUserService: LoggedUserService,
      ) =>
        new FindCashRegisterReportUseCase(
          cashRegisterSessionRepository,
          findCashRegisterSessionDetailUseCase,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        FindCashRegisterSessionDetailUseCase,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindProductionReportUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindProductionReportUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindExpenseReportUseCase,
      useFactory: (
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) => new FindExpenseReportUseCase(expenseRepository, loggedUserService),
      inject: [PROVIDERS.EXPENSE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindDailyRevenueSeriesUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        loggedUserService: LoggedUserService,
      ) => new FindDailyRevenueSeriesUseCase(saleRepository, loggedUserService),
      inject: [PROVIDERS.SALE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindCostComparisonSeriesUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        expenseRepository: ExpenseRepository,
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindCostComparisonSeriesUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          expenseRepository,
          batchMovementRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.EXPENSE_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindPaymentMethodBreakdownUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindPaymentMethodBreakdownUseCase(saleRepository, loggedUserService),
      inject: [PROVIDERS.SALE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindTopWastedProductsUseCase,
      useFactory: (
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindTopWastedProductsUseCase(
          batchMovementRepository,
          loggedUserService,
        ),
      inject: [PROVIDERS.BATCH_MOVEMENT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: GenerateWasteReportPdfUseCase,
      useFactory: (
        findWasteReportUseCase: FindWasteReportUseCase,
        loggedUserService: LoggedUserService,
      ) =>
        new GenerateWasteReportPdfUseCase(findWasteReportUseCase, loggedUserService),
      inject: [FindWasteReportUseCase, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: GenerateCashRegisterReportPdfUseCase,
      useFactory: (
        findCashRegisterReportUseCase: FindCashRegisterReportUseCase,
        loggedUserService: LoggedUserService,
      ) =>
        new GenerateCashRegisterReportPdfUseCase(
          findCashRegisterReportUseCase,
          loggedUserService,
        ),
      inject: [FindCashRegisterReportUseCase, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: GenerateProductionReportPdfUseCase,
      useFactory: (
        findProductionReportUseCase: FindProductionReportUseCase,
        loggedUserService: LoggedUserService,
      ) =>
        new GenerateProductionReportPdfUseCase(
          findProductionReportUseCase,
          loggedUserService,
        ),
      inject: [FindProductionReportUseCase, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: GenerateExpenseReportPdfUseCase,
      useFactory: (
        findExpenseReportUseCase: FindExpenseReportUseCase,
        loggedUserService: LoggedUserService,
      ) =>
        new GenerateExpenseReportPdfUseCase(
          findExpenseReportUseCase,
          loggedUserService,
        ),
      inject: [FindExpenseReportUseCase, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [],
})
export class ReportModule {}
