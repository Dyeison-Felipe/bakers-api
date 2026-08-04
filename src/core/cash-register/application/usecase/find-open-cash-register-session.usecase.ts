import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { FindOpenCashRegisterOutput } from '@/shared/application/output/cash-register/find-open-cash-register.output';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';

type Input = Record<string, never>;

type Output = FindOpenCashRegisterOutput;

export class FindOpenCashRegisterSessionUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const session = await this.cashRegisterSessionRepository.findOpenByCompanyId(
      loggedUser.company.id,
    );

    if (!session) return null;

    return {
      id: session.id,
      status: session.status,
      openingAmount: session.openingAmount,
      openedAt: session.openedAt,
      openedBy: session.openedBy,
    };
  }
}
