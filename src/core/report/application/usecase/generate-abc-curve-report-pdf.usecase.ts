import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';
import { FindAbcCurveReportUseCase } from './find-abc-curve-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = Buffer;

export class GenerateAbcCurveReportPdfUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly findAbcCurveReportUseCase: FindAbcCurveReportUseCase,
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
    const data = await this.findAbcCurveReportUseCase.execute({
      dateFrom,
      dateTo,
      productId,
      categoryId,
      typeProduct,
    });

    return ReportPdfService.generateAbcCurveReport({
      company: {
        fantasyName: loggedUser.company.fantasyName,
        cnpj: loggedUser.company.cnpj,
      },
      period: { from: dateFrom, to: dateTo },
      data,
    });
  }
}
