import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SalePersistenceModule } from '@/core/sale/infra/sale-persistence.module';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { DailyProductionPersistenceModule } from '@/core/daily-production/infra/daily-production-persistence.module';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpensePersistenceModule } from '@/core/expense/infra/expense-persistence.module';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { DashboardController } from './controller/dashboard.controller';
import { FindDashboardSummaryUseCase } from '../application/usecase/find-dashboard-summary.usecase';

@Module({
  imports: [
    SalePersistenceModule,
    DailyProductionPersistenceModule,
    ExpensePersistenceModule,
  ],
  controllers: [DashboardController],
  providers: [
    {
      provide: FindDashboardSummaryUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindDashboardSummaryUseCase(
          saleRepository,
          dailyProductionRepository,
          dailyProductionItemRepository,
          expenseRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.EXPENSE_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class DashboardModule {}
