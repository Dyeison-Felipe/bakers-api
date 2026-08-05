import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SalePersistenceModule } from '@/core/sale/infra/sale-persistence.module';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionPersistenceModule } from '@/core/daily-production/infra/daily-production-persistence.module';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { DashboardController } from './controller/dashboard.controller';
import { FindDashboardSummaryUseCase } from '../application/usecase/find-dashboard-summary.usecase';

@Module({
  imports: [SalePersistenceModule, DailyProductionPersistenceModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: FindDashboardSummaryUseCase,
      useFactory: (
        saleItemRepository: SaleItemRepository,
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindDashboardSummaryUseCase(
          saleItemRepository,
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.SALE_ITEM_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class DashboardModule {}
