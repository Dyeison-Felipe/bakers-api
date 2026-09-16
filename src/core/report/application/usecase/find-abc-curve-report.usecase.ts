import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import {
  AbcCurveClassification,
  AbcCurveReportItem,
  AbcCurveReportOutput,
} from '@/shared/application/output/report/abc-curve-report.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = AbcCurveReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

// Corte clássico de Pareto: itens que somam até 80% da receita acumulada
// são classe A, até 95% classe B, o restante classe C.
const classify = (cumulativePercent: number): AbcCurveClassification => {
  if (cumulativePercent <= 80) return 'A';
  if (cumulativePercent <= 95) return 'B';
  return 'C';
};

export class FindAbcCurveReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const rows = await this.saleItemRepository.findRevenueAndCostByProductAndDateRange(
      companyId,
      dateFrom,
      dateTo,
    );

    const sortedRows = [...rows].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = round2(
      sortedRows.reduce((sum, row) => sum + row.revenue, 0),
    );

    let cumulativePercent = 0;

    const items: AbcCurveReportItem[] = sortedRows.map((row) => {
      const revenue = round2(row.revenue);
      const revenuePercent = totalRevenue ? round2((revenue / totalRevenue) * 100) : 0;
      cumulativePercent = round2(cumulativePercent + revenuePercent);

      return {
        productId: row.productId,
        productName: row.productName,
        quantitySold: row.quantitySold,
        revenue,
        revenuePercent,
        cumulativePercent,
        classification: classify(cumulativePercent),
      };
    });

    return { totalRevenue, items };
  }
}
