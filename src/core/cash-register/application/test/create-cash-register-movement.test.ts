import { CreateCashRegisterMovementUseCase } from '../usecase/create-cash-register-movement.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { makeLoggedUser, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import type { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import type { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CreateCashRegisterMovementUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findOpenByCompanyId'>
  >;
  let cashRegisterMovementRepository: jest.Mocked<
    Pick<
      CashRegisterMovementRepository,
      'save' | 'sumAmountByCashRegisterSessionIdAndType'
    >
  >;
  let saleRepository: jest.Mocked<
    Pick<SaleRepository, 'sumTotalByCashRegisterSessionAndPaymentMethod'>
  >;
  let expenseRepository: jest.Mocked<Pick<ExpenseRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CreateCashRegisterMovementUseCase;

  const baseInput = {
    type: TypeCashRegisterMovement.WITHDRAWAL,
    reason: TypeCashRegisterMovementReason.OWNER_REINFORCEMENT,
    amount: 50,
  };

  beforeEach(() => {
    cashRegisterSessionRepository = {
      findOpenByCompanyId: jest.fn().mockResolvedValue(makeSession({ openingAmount: 100 })),
    };
    cashRegisterMovementRepository = {
      save: jest.fn().mockImplementation((m) => Promise.resolve(m)),
      sumAmountByCashRegisterSessionIdAndType: jest.fn().mockResolvedValue(0),
    };
    saleRepository = {
      sumTotalByCashRegisterSessionAndPaymentMethod: jest.fn().mockResolvedValue(0),
    };
    expenseRepository = { save: jest.fn().mockResolvedValue(undefined) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new CreateCashRegisterMovementUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      cashRegisterMovementRepository as unknown as CashRegisterMovementRepository,
      saleRepository as unknown as SaleRepository,
      expenseRepository as unknown as ExpenseRepository,
      loggedUserService,
    );
  });

  it('should throw BadRequestError when amount is zero or negative', async () => {
    await expect(sut.execute({ ...baseInput, amount: 0 })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when reason is OTHER without a description', async () => {
    await expect(
      sut.execute({ ...baseInput, reason: TypeCashRegisterMovementReason.OTHER }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when EXPENSE_PAYMENT is used with a SUPPLY movement', async () => {
    await expect(
      sut.execute({
        ...baseInput,
        type: TypeCashRegisterMovement.SUPPLY,
        reason: TypeCashRegisterMovementReason.EXPENSE_PAYMENT,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw NotFoundError when there is no open cash register session', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when a withdrawal would leave the balance negative', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(
      makeSession({ openingAmount: 10 }),
    );

    await expect(
      sut.execute({ ...baseInput, amount: 50 }),
    ).rejects.toThrow(BadRequestError);
    expect(cashRegisterMovementRepository.save).not.toHaveBeenCalled();
  });

  it('should save a WITHDRAWAL movement decreasing the balance', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(
      makeSession({ openingAmount: 100 }),
    );

    const output = await sut.execute({ ...baseInput, amount: 30 });

    expect(output.balanceBefore).toBe(100);
    expect(output.balanceAfter).toBe(70);
    expect(output.type).toBe(TypeCashRegisterMovement.WITHDRAWAL);
  });

  it('should save a SUPPLY movement increasing the balance', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(
      makeSession({ openingAmount: 100 }),
    );

    const output = await sut.execute({
      type: TypeCashRegisterMovement.SUPPLY,
      reason: TypeCashRegisterMovementReason.OWNER_REINFORCEMENT,
      amount: 30,
    });

    expect(output.balanceBefore).toBe(100);
    expect(output.balanceAfter).toBe(130);
  });

  it('should create an Expense automatically when reason is EXPENSE_PAYMENT on a withdrawal', async () => {
    await sut.execute({
      type: TypeCashRegisterMovement.WITHDRAWAL,
      reason: TypeCashRegisterMovementReason.EXPENSE_PAYMENT,
      amount: 20,
      description: 'Conta de luz',
    });

    expect(expenseRepository.save).toHaveBeenCalledTimes(1);
    const savedExpense = expenseRepository.save.mock.calls[0][0];
    expect(savedExpense.value).toBe(20);
  });

  it('should not create an Expense for other reasons', async () => {
    await sut.execute(baseInput);

    expect(expenseRepository.save).not.toHaveBeenCalled();
  });
});
