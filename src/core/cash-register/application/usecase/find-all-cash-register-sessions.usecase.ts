import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { FindAllCashRegisterSessionsItemOutput } from '@/shared/application/output/cash-register/find-all-cash-register-sessions.output';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';

type Input = {
  page?: number;
  limit?: number;
};

type Output = PaginationOutput<FindAllCashRegisterSessionsItemOutput>;

export class FindAllCashRegisterSessionsUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const sessions = await this.cashRegisterSessionRepository.findAllByCompanyId(
      loggedUser.company.id,
      {
        page: input.page,
        limit: input.limit,
      },
    );

    const items = sessions.items.map((session) => ({
      id: session.id,
      status: session.status,
      openingAmount: session.openingAmount,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      totalCash: session.totalCash,
      totalPix: session.totalPix,
      totalCard: session.totalCard,
    }));

    return {
      items,
      meta: sessions.meta,
    };
  }
}
