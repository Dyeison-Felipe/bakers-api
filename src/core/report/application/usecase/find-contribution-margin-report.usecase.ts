import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import {
  ContributionMarginReportItem,
  ContributionMarginReportOutput,
} from '@/shared/application/output/report/contribution-margin-report.output';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = ContributionMarginReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindContributionMarginReportUseCase
  implements UseCase<Input, Output>
{
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

    const items: ContributionMarginReportItem[] = rows
      .map((row) => {
        const revenue = round2(row.revenue);
        const variableCost = round2(row.cost);
        const contributionMargin = round2(revenue - variableCost);

        return {
          productId: row.productId,
          productName: row.productName,
          quantitySold: row.quantitySold,
          revenue,
          variableCost,
          contributionMargin,
          contributionMarginPercent: revenue
            ? round2((contributionMargin / revenue) * 100)
            : 0,
        };
      })
      .sort((a, b) => b.contributionMargin - a.contributionMargin);

    const totalRevenue = round2(items.reduce((sum, item) => sum + item.revenue, 0));
    const totalVariableCost = round2(
      items.reduce((sum, item) => sum + item.variableCost, 0),
    );

    return {
      totalRevenue,
      totalVariableCost,
      totalContributionMargin: round2(totalRevenue - totalVariableCost),
      items,
    };
  }
}
