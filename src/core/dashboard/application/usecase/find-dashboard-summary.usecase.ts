import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { DashboardSummaryOutput } from '@/shared/application/output/dashboard/dashboard-summary.output';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';

type Input = void;
type Output = DashboardSummaryOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindDashboardSummaryUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const [salesSummary, dailyProductions] = await Promise.all([
      this.saleItemRepository.sumRevenueAndCostByCompanyAndDateRange(
        companyId,
        startOfDay,
        endOfDay,
      ),
      this.dailyProductionRepository.findAllByCompanyId(companyId, {
        productionDate: startOfDay,
      }),
    ]);

    const productionItemsByProduction = await Promise.all(
      dailyProductions.items.map((production) =>
        this.dailyProductionItemRepository.findAllByDailyProductionId(
          production.id,
        ),
      ),
    );

    const productionCostToday = round2(
      productionItemsByProduction
        .flat()
        .reduce((sum, item) => sum + item.plannedCost, 0),
    );

    return {
      productionCostToday,
      salesRevenueToday: round2(salesSummary.totalRevenue),
      costOfSoldToday: round2(salesSummary.totalCost),
      profitToday: round2(salesSummary.totalRevenue - salesSummary.totalCost),
    };
  }
}
