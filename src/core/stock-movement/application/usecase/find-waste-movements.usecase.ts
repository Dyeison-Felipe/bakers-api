import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { StockMovementRepository, StockMovementReportItem } from '../../domain/repositories/stock-movement.repository';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = {
  items: StockMovementReportItem[];
};

export class FindWasteMovementsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const items = await this.stockMovementRepository.findAllByCompanyAndDateAndReason(
      companyId,
      dateFrom,
      dateTo,
      [TypeStockMovementReason.WASTE],
    );

    return { items };
  }
}
