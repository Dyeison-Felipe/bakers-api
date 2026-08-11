import { FindCashRegisterSessionDetailUseCase } from '../usecase/find-cash-register-session-detail.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
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
    Pick<ExpenseRepository, 'findAllByCompanyId'>
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
    expenseRepository = {
      findAllByCompanyId: jest.fn().mockResolvedValue(makePagination([])),
    };
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

  it('should compute profit as totalSales + totalRecoveredAtCost - productionCost - totalWaste - totalExpenses', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    saleItemRepository.sumRevenueAndCostByCashRegisterSessionId.mockResolvedValue({
      totalRevenue: 500,
      totalCost: 200,
    });
    expenseRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([
        { id: 'e1', value: 50 } as never,
        { id: 'e2', value: 30 } as never,
      ]),
    );
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([{ id: 'dp-1' } as never]),
    );
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      { status: 'PRODUCED', plannedCost: 60 } as never,
    ]);
    batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mockImplementation(
      (_companyId, _from, _to, reasons) =>
        Promise.resolve(
          reasons.includes(TypeBatchMovementReason.WASTE) ? 40 : 10,
        ),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalSales).toBe(500);
    expect(output.costOfSold).toBe(200);
    expect(output.productionCost).toBe(60);
    expect(output.totalWaste).toBe(40);
    expect(output.totalRecoveredAtCost).toBe(10);
    expect(output.totalExpenses).toBe(80);
    expect(output.profit).toBe(330); // 500 + 10 - 60 - 40 - 80
  });

  it('should sum plannedCost only across PRODUCED items of every daily production on the session day', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([{ id: 'dp-1' } as never, { id: 'dp-2' } as never]),
    );
    dailyProductionItemRepository.findAllByDailyProductionId.mockImplementation(
      (dailyProductionId) =>
        Promise.resolve(
          dailyProductionId === 'dp-1'
            ? [
                { status: 'PRODUCED', plannedCost: 10 } as never,
                { status: 'PRODUCED', plannedCost: 15 } as never,
                { status: 'PLANNED', plannedCost: 999 } as never,
                { status: 'CANCELLED', plannedCost: 999 } as never,
              ]
            : [{ status: 'PRODUCED', plannedCost: 20 } as never],
        ),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.productionCost).toBe(45);
  });

  it('should map totalWaste and totalRecoveredAtCost from batch movement sums', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mockImplementation(
      (_companyId, _from, _to, reasons) =>
        Promise.resolve(
          reasons.includes(TypeBatchMovementReason.WASTE) ? 40 : 15,
        ),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalWaste).toBe(40);
    expect(output.totalRecoveredAtCost).toBe(15);
  });

  it('should include MANUAL_DISCARD write-offs (from the batch write-off screen) alongside WASTE when summing totalWaste', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    await sut.execute({ id: session.id });

    const [wasteCall] =
      batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mock.calls;
    const [, , , reasons] = wasteCall;
    expect(reasons).toEqual(['WASTE', 'MANUAL_DISCARD']);

    const [, , , recoveredReasons] =
      batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mock.calls[1];
    expect(recoveredReasons).toEqual(['LEFTOVER_SOLD_AT_COST']);
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

  it('should scope production, expenses and batch movements to the full session window, not just the opening day', async () => {
    const session = makeSession({
      openedAt: new Date('2026-08-06T09:00:00'),
      closedAt: new Date('2026-08-10T18:30:00'),
      status: 'CLOSED',
    });
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    await sut.execute({ id: session.id });

    const [, productionFilters] =
      dailyProductionRepository.findAllByCompanyId.mock.calls[0];
    expect(productionFilters).toEqual({
      productionDateFrom: new Date(2026, 7, 6),
      productionDateTo: new Date(2026, 7, 10),
    });

    const [, expenseFilters] = expenseRepository.findAllByCompanyId.mock.calls[0];
    expect(expenseFilters).toEqual({
      dateFrom: new Date(2026, 7, 6),
      dateTo: new Date(2026, 7, 10),
    });

    const [, waitFrom, waitTo] =
      batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mock.calls[0];
    expect(waitFrom).toEqual(session.openedAt);
    expect(waitTo).toEqual(session.closedAt);
  });

  it('should use "now" as the batch movement window end when the session is still open', async () => {
    const session = makeSession({
      openedAt: new Date('2026-08-06T09:00:00'),
      closedAt: null,
    });
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    const before = new Date();
    await sut.execute({ id: session.id });
    const after = new Date();

    const [, , windowEnd] =
      batchMovementRepository.sumUnitCostByCompanyAndDateAndReason.mock.calls[0];
    expect((windowEnd as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect((windowEnd as Date).getTime()).toBeLessThanOrEqual(after.getTime());
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
