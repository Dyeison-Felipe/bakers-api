import { FindCashRegisterSessionDetailUseCase } from '../usecase/find-cash-register-session-detail.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makePagination, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import type { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import type { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import type { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import type { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCashRegisterSessionDetailUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findByIdAndCompanyId'>
  >;
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'sumRevenueAndCostByCashRegisterSessionId'>
  >;
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findAllByCompanyId'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let expenseRepository: jest.Mocked<
    Pick<ExpenseRepository, 'findAllByCompanyAndDate'>
  >;
  let batchMovementRepository: jest.Mocked<
    Pick<BatchMovementRepository, 'sumUnitCostByCompanyAndDateAndReason'>
  >;
  let cashRegisterMovementRepository: jest.Mocked<
    Pick<CashRegisterMovementRepository, 'sumAmountByCashRegisterSessionIdAndType'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCashRegisterSessionDetailUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = { findByIdAndCompanyId: jest.fn() };
    saleItemRepository = {
      sumRevenueAndCostByCashRegisterSessionId: jest
        .fn()
        .mockResolvedValue({ totalRevenue: 0, totalCost: 0 }),
    };
    dailyProductionRepository = {
      findAllByCompanyId: jest.fn().mockResolvedValue(makePagination([])),
    };
    dailyProductionItemRepository = {
      findAllByDailyProductionId: jest.fn().mockResolvedValue([]),
    };
    expenseRepository = { findAllByCompanyAndDate: jest.fn().mockResolvedValue([]) };
    batchMovementRepository = {
      sumUnitCostByCompanyAndDateAndReason: jest.fn().mockResolvedValue(0),
    };
    cashRegisterMovementRepository = {
      sumAmountByCashRegisterSessionIdAndType: jest.fn().mockResolvedValue(0),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindCashRegisterSessionDetailUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      saleItemRepository as unknown as SaleItemRepository,
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      expenseRepository as unknown as ExpenseRepository,
      batchMovementRepository as unknown as BatchMovementRepository,
      cashRegisterMovementRepository as unknown as CashRegisterMovementRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the session does not exist for the logged company', async () => {
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'session-1' })).rejects.toThrow(NotFoundError);
  });

  it('should compute profit as totalSales - costOfSold - totalExpenses', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    saleItemRepository.sumRevenueAndCostByCashRegisterSessionId.mockResolvedValue({
      totalRevenue: 500,
      totalCost: 200,
    });
    expenseRepository.findAllByCompanyAndDate.mockResolvedValue([
      { id: 'e1', value: 50 } as never,
      { id: 'e2', value: 30 } as never,
    ]);

    const output = await sut.execute({ id: session.id });

    expect(output.totalSales).toBe(500);
    expect(output.costOfSold).toBe(200);
    expect(output.totalExpenses).toBe(80);
    expect(output.profit).toBe(220); // 500 - 200 - 80
  });

  it('should sum plannedCost across all items of every daily production on the session day', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([{ id: 'dp-1' } as never, { id: 'dp-2' } as never]),
    );
    dailyProductionItemRepository.findAllByDailyProductionId.mockImplementation(
      (dailyProductionId) =>
        Promise.resolve(
          dailyProductionId === 'dp-1'
            ? [{ plannedCost: 10 } as never, { plannedCost: 15 } as never]
            : [{ plannedCost: 20 } as never],
        ),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.productionCost).toBe(45);
  });

  it('should map totalWaste and totalRecoveredAtCost from batch movement sums', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mockImplementation(
      (_companyId, _from, _to, reason) =>
        Promise.resolve(reason === 'WASTE' ? 40 : 15),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalWaste).toBe(40);
    expect(output.totalRecoveredAtCost).toBe(15);
  });

  it('should map totalSupplies and totalWithdrawals from cash register movement sums', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType.mockImplementation(
      (_id, type) => Promise.resolve(type === 'SUPPLY' ? 60 : 25),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalSupplies).toBe(60);
    expect(output.totalWithdrawals).toBe(25);
  });

  it('should pass through the session summary fields (openingAmount, status, totals)', async () => {
    const session = makeSession({
      openingAmount: 100,
      totalCash: 200,
      totalPix: 50,
      totalCard: 30,
    });
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    const output = await sut.execute({ id: session.id });

    expect(output).toMatchObject({
      id: session.id,
      status: session.status,
      openingAmount: 100,
      totalCash: 200,
      totalPix: 50,
      totalCard: 30,
    });
  });
});
