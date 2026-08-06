import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CashRegisterMovementOutput } from '@/shared/application/output/cash-register/cash-register-movement.output';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';

type Input = {
  cashRegisterSessionId: string;
};

type Output = CashRegisterMovementOutput[];

export class FindCashRegisterMovementsUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY)
    private readonly cashRegisterMovementRepository: CashRegisterMovementRepository,
  ) {}

  async execute({ cashRegisterSessionId }: Input): Promise<Output> {
    const session = await this.cashRegisterSessionRepository.findById(
      cashRegisterSessionId,
    );

    if (!session) {
      throw new NotFoundError('Caixa não encontrado');
    }

    const movements =
      await this.cashRegisterMovementRepository.findAllByCashRegisterSessionId(
        cashRegisterSessionId,
      );

    return movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      reason: movement.reason,
      description: movement.description,
      amount: movement.amount,
      balanceBefore: movement.balanceBefore,
      balanceAfter: movement.balanceAfter,
      createdAt: movement.auditable!.createdAt,
    }));
  }
}
