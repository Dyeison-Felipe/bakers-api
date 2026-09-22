import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import {
  ProductionReportDailyPoint,
  ProductionReportItem,
  ProductionReportOutput,
} from '@/shared/application/output/report/production-report.output';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = ProductionReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

export class FindProductionReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({
    dateFrom,
    dateTo,
    productId,
    categoryId,
    typeProduct,
  }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const productions = await this.dailyProductionRepository.findAllByCompanyId(
      companyId,
      { productionDateFrom: dateFrom, productionDateTo: dateTo },
      { limit: 1000 },
    );

    const itemsByProduction = await Promise.all(
      productions.items.map((production) =>
        this.dailyProductionItemRepository
          .findAllByDailyProductionId(production.id)
          .then((items) =>
            items.map((item) => ({ item, production })),
          ),
      ),
    );

    // Filtro por produto/categoria/tipo aplicado em memória: os itens já
    // vêm carregados com `product`/`product.category` (findAllByDailyProductionId),
    // e o volume por produção é pequeno — não compensa uma query por filtro.
    const items: ProductionReportItem[] = itemsByProduction
      .flat()
      .filter(
        ({ item }) =>
          (!productId || item.product?.id === productId) &&
          (!categoryId || item.product?.category?.id === categoryId) &&
          (!typeProduct || item.product?.typeProduct === typeProduct),
      )
      .map(({ item, production }) => ({
        id: item.id,
        productionDate: production.productionDate,
        productId: item.product?.id ?? '',
        productName: item.product?.name ?? '',
        plannedQuantity: item.plannedQuantity,
        plannedWeight: item.plannedWeight,
        plannedCost: round2(item.plannedCost),
        status: item.status,
      }));

    const producedItems = items.filter(
      (item) => item.status === TypeDailyProductionItemStatus.PRODUCED,
    );

    const totalProducedCost = round2(
      producedItems.reduce((sum, item) => sum + item.plannedCost, 0),
    );

    const dailyMap = new Map<string, number>();
    for (const item of producedItems) {
      const day = toDayKey(item.productionDate);
      dailyMap.set(day, round2((dailyMap.get(day) ?? 0) + item.plannedCost));
    }
    const dailySeries: ProductionReportDailyPoint[] = Array.from(
      dailyMap.entries(),
    )
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      totalProducedCost,
      dailySeries,
      items,
    };
  }
}
