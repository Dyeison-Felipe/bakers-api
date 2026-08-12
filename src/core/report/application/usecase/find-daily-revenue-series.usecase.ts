import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { DailyRevenueSeriesOutput } from '@/shared/application/output/report/daily-revenue-series.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = DailyRevenueSeriesOutput;

export class FindDailyRevenueSeriesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    return this.saleRepository.findDailyRevenueByCompanyAndDateRange(
      companyId,
      dateFrom,
      dateTo,
    );
  }
}
