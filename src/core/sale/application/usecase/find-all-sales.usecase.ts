import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { FindAllSalesItemOutput } from '@/shared/application/output/sale/sale.output';
import { SaleRepository } from '../../domain/repositories/sale.repository';

type Input = {
  page?: number;
  cashRegisterSessionId?: string;
};

type Output = PaginationOutput<FindAllSalesItemOutput>;

export class FindAllSalesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ page, cashRegisterSessionId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const sales = await this.saleRepository.findAllByCompanyId(
      loggedUser.company.id,
      { cashRegisterSessionId },
      { page },
    );

    return {
      items: sales.items.map((sale) => ({
        id: sale.id,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount,
        createdAt: sale.auditable?.createdAt ?? new Date(),
      })),
      meta: sales.meta,
    };
  }
}
