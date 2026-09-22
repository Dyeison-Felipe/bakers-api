import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import {
  CpvReportItem,
  CpvReportOutput,
} from '@/shared/application/output/report/cpv-report.output';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = CpvReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindCpvReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
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

    const rows = await this.saleItemRepository.findRevenueAndCostByProductAndDateRange(
      companyId,
      dateFrom,
      dateTo,
      { productId, categoryId, typeProduct },
    );

    const items: CpvReportItem[] = rows
      .map((row) => {
        const revenue = round2(row.revenue);
        const cpv = round2(row.cost);

        return {
          productId: row.productId,
          productName: row.productName,
          quantitySold: row.quantitySold,
          revenue,
          cpv,
          grossProfit: round2(revenue - cpv),
        };
      })
      .sort((a, b) => b.cpv - a.cpv);

    const totalRevenue = round2(items.reduce((sum, item) => sum + item.revenue, 0));
    const totalCpv = round2(items.reduce((sum, item) => sum + item.cpv, 0));

    return {
      totalRevenue,
      totalCpv,
      grossProfit: round2(totalRevenue - totalCpv),
      items,
    };
  }
}
