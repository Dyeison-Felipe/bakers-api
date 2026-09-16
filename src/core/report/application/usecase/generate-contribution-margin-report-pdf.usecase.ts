import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { FindContributionMarginReportUseCase } from './find-contribution-margin-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = Buffer;

export class GenerateContributionMarginReportPdfUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly findContributionMarginReportUseCase: FindContributionMarginReportUseCase,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const data = await this.findContributionMarginReportUseCase.execute({
      dateFrom,
      dateTo,
    });

    return ReportPdfService.generateContributionMarginReport({
      company: {
        fantasyName: loggedUser.company.fantasyName,
        cnpj: loggedUser.company.cnpj,
      },
      period: { from: dateFrom, to: dateTo },
      data,
    });
  }
}
