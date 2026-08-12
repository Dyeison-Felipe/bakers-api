import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { FindWasteReportUseCase } from './find-waste-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = Buffer;

export class GenerateWasteReportPdfUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly findWasteReportUseCase: FindWasteReportUseCase,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const data = await this.findWasteReportUseCase.execute({ dateFrom, dateTo });

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
