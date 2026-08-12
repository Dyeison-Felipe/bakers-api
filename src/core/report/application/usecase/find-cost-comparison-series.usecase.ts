import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { CostComparisonSeriesOutput } from '@/shared/application/output/report/cost-comparison-series.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = CostComparisonSeriesOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

export class FindCostComparisonSeriesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const [productions, expenses, wasteRows] = await Promise.all([
      this.dailyProductionRepository.findAllByCompanyId(
        companyId,
        { productionDateFrom: dateFrom, productionDateTo: dateTo },
        { limit: 1000 },
      ),
      this.expenseRepository.findAllByCompanyId(
        companyId,
        { dateFrom, dateTo },
        { limit: 1000 },
      ),
      this.batchMovementRepository.findAllByCompanyAndDateAndReason(
        companyId,
        dateFrom,
        dateTo,
        [TypeBatchMovementReason.WASTE, TypeBatchMovementReason.MANUAL_DISCARD],
      ),
    ]);

    const itemsByProduction = await Promise.all(
      productions.items.map((production) =>
        this.dailyProductionItemRepository
          .findAllByDailyProductionId(production.id)
          .then((items) => items.map((item) => ({ item, production }))),
      ),
    );

    const productionCostByDay = new Map<string, number>();
    for (const { item, production } of itemsByProduction.flat()) {
      const day = toDayKey(production.productionDate);
      productionCostByDay.set(
        day,
        round2((productionCostByDay.get(day) ?? 0) + item.plannedCost),
      );
    }

    const expensesByDay = new Map<string, number>();
    for (const expense of expenses.items) {
      const day = toDayKey(expense.date);
      expensesByDay.set(
        day,
        round2((expensesByDay.get(day) ?? 0) + expense.value),
      );
    }

    const wasteByDay = new Map<string, number>();
    for (const row of wasteRows) {
      const day = toDayKey(row.createdAt);
      wasteByDay.set(day, round2((wasteByDay.get(day) ?? 0) + row.totalCost));
    }

    const allDays = new Set<string>([
      ...productionCostByDay.keys(),
      ...expensesByDay.keys(),
      ...wasteByDay.keys(),
    ]);

    return Array.from(allDays)
      .sort((a, b) => a.localeCompare(b))
      .map((day) => ({
        day,
        productionCost: productionCostByDay.get(day) ?? 0,
        expenses: expensesByDay.get(day) ?? 0,
        waste: wasteByDay.get(day) ?? 0,
      }));
  }
}
