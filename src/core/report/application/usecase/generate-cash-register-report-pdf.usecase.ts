import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { FindCashRegisterReportUseCase } from './find-cash-register-report.usecase';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = Buffer;

export class GenerateCashRegisterReportPdfUseCase
  implements UseCase<Input, Output>
{
  constructor(
    private readonly findCashRegisterReportUseCase: FindCashRegisterReportUseCase,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const data = await this.findCashRegisterReportUseCase.execute({
      dateFrom,
      dateTo,
    });

    return ReportPdfService.generateCashRegisterReport({
      company: {
        fantasyName: loggedUser.company.fantasyName,
        cnpj: loggedUser.company.cnpj,
      },
      period: { from: dateFrom, to: dateTo },
      data,
    });
  }
}
