import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { Transactional } from 'typeorm-transactional';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { CashRegisterMovementOutput } from '@/shared/application/output/cash-register/cash-register-movement.output';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { Expense } from '@/core/expense/domain/entities/expense.entity';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import { CashRegisterMovement } from '../../domain/entities/cash-register-movement.entity';

type Input = {
  type: TypeCashRegisterMovement;
  reason: TypeCashRegisterMovementReason;
  description?: string;
  amount: number;
};

type Output = CashRegisterMovementOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class CreateCashRegisterMovementUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY)
    private readonly cashRegisterMovementRepository: CashRegisterMovementRepository,
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    if (input.amount <= 0) {
      throw new BadRequestError('Informe um valor maior que zero');
    }

    if (
      input.reason === TypeCashRegisterMovementReason.OTHER &&
      !input.description?.trim()
    ) {
      throw new BadRequestError(
        'Informe uma descrição para o motivo "Outro"',
      );
    }

    if (
      input.reason === TypeCashRegisterMovementReason.EXPENSE_PAYMENT &&
      input.type !== TypeCashRegisterMovement.WITHDRAWAL
    ) {
      throw new BadRequestError(
        'Pagamento de despesa só é válido para sangria (retirada)',
      );
    }

    const session = await this.cashRegisterSessionRepository.findOpenByCompanyId(
      companyId,
    );

    if (!session) {
      throw new NotFoundError('Nenhum caixa aberto encontrado');
    }

    const [totalCash, totalSupplies, totalWithdrawals] = await Promise.all([
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.CASH,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.SUPPLY,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.WITHDRAWAL,
      ),
    ]);

    const balanceBefore = round2(
      session.openingAmount + totalCash + totalSupplies - totalWithdrawals,
    );

    const balanceAfter =
      input.type === TypeCashRegisterMovement.WITHDRAWAL
        ? round2(balanceBefore - input.amount)
        : round2(balanceBefore + input.amount);

    if (
      input.type === TypeCashRegisterMovement.WITHDRAWAL &&
      balanceAfter < 0
    ) {
      throw new BadRequestError(
        'Valor da sangria maior que o saldo disponível em caixa',
      );
    }

    const movement = CashRegisterMovement.create({
      cashRegisterSession: session,
      type: input.type,
      reason: input.reason,
      description: input.description?.trim() || null,
      amount: input.amount,
      balanceBefore,
      balanceAfter,
      createdBy: loggedUser.id,
    });

    const saved = await this.cashRegisterMovementRepository.save(movement);

    if (input.reason === TypeCashRegisterMovementReason.EXPENSE_PAYMENT) {
      const expense = Expense.create({
        company: loggedUser.company,
        date: new Date(),
        value: input.amount,
        description: input.description?.trim() || 'Sangria - pagamento de despesa',
        createdBy: loggedUser.id,
      });

      await this.expenseRepository.save(expense);
    }

    return {
      id: saved.id,
      type: saved.type,
      reason: saved.reason,
      description: saved.description,
      amount: saved.amount,
      balanceBefore: saved.balanceBefore,
      balanceAfter: saved.balanceAfter,
      createdAt: saved.auditable!.createdAt,
    };
  }
}
