import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { OpenCashRegisterOutput } from '@/shared/application/output/cash-register/open-cash-register.output';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterSession } from '../../domain/entities/cash-register-session.entity';

type Input = {
  openingAmount: number;
};

type Output = OpenCashRegisterOutput;

export class OpenCashRegisterSessionUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const openSession =
      await this.cashRegisterSessionRepository.findOpenByCompanyId(
        company.id,
      );

    if (openSession) {
      throw new ConflictError('Já existe um caixa aberto para esta empresa');
    }

    const session = CashRegisterSession.open({
      company,
      openingAmount: input.openingAmount,
      openedBy: loggedUser.id,
    });

    const saved = await this.cashRegisterSessionRepository.save(session);

    return {
      id: saved.id,
      status: saved.status,
      openingAmount: saved.openingAmount,
      openedAt: saved.openedAt,
    };
  }
}
