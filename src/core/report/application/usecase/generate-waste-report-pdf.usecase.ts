import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';
import { FindWasteReportUseCase } from './find-waste-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
} & ReportProductFilters;

type Output = Buffer;

export class GenerateWasteReportPdfUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly findWasteReportUseCase: FindWasteReportUseCase,
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
    const data = await this.findWasteReportUseCase.execute({
      dateFrom,
      dateTo,
      productId,
      categoryId,
      typeProduct,
    });

    return ReportPdfService.generateWasteReport({
      company: {
        fantasyName: loggedUser.company.fantasyName,
        cnpj: loggedUser.company.cnpj,
      },
      period: { from: dateFrom, to: dateTo },
      data,
    });
  }
}
