import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';
import { FindProductionReportUseCase } from './find-production-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = Buffer;

export class GenerateProductionReportPdfUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly findProductionReportUseCase: FindProductionReportUseCase,
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
    const data = await this.findProductionReportUseCase.execute({
      dateFrom,
      dateTo,
      productId,
      categoryId,
      typeProduct,
    });

    return ReportPdfService.generateProductionReport({
      company: {
        fantasyName: loggedUser.company.fantasyName,
        cnpj: loggedUser.company.cnpj,
      },
      period: { from: dateFrom, to: dateTo },
      data,
    });
  }
}
