import { FindCashRegisterReportUseCase } from '../usecase/find-cash-register-report.usecase';
import { makeSession } from '@/core/cash-register/application/test/fixtures';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import type { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '@/core/cash-register/domain/repositories/cash-register-movement.repository';
import type { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import type { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import type { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import type { StockMovementRepository } from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import type { Expense } from '@/core/expense/domain/entities/expense.entity';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCashRegisterReportUseCase', () => {
  let sessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findAllByCompanyIdAndDateRange'>
  >;
  let movementRepository: jest.Mocked<
    Pick<
      CashRegisterMovementRepository,
      'sumAmountByCashRegisterSessionIdsAndType'
    >
  >;
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'sumRevenueAndCostByCashRegisterSessionIds'>
  >;
  let productionItemRepository: jest.Mocked<
    Pick<
      DailyProductionItemRepository,
      'sumProducedPlannedCostByCompanyAndWindows'
    >
  >;
  let expenseRepository: jest.Mocked<
    Pick<ExpenseRepository, 'findAllByCompanyIdAndDayWindows'>
  >;
  let stockMovementRepository: jest.Mocked<
    Pick<StockMovementRepository, 'sumUnitCostByCompanyAndWindowsAndReason'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCashRegisterReportUseCase;

  const dateFrom = new Date('2026-08-01T00:00:00Z');
  const dateTo = new Date('2026-08-31T23:59:59Z');

  const makeExpense = (id: string, value: number): Expense =>
    ({
      id,
      date: new Date('2026-08-09T00:00:00Z'),
      value,
      description: `despesa ${id}`,
    }) as unknown as Expense;

  beforeEach(() => {
    sessionRepository = {
      findAllByCompanyIdAndDateRange: jest.fn().mockResolvedValue([]),
    };
    movementRepository = {
      sumAmountByCashRegisterSessionIdsAndType: jest
        .fn()
        .mockResolvedValue(new Map()),
    };
    saleItemRepository = {
      sumRevenueAndCostByCashRegisterSessionIds: jest
        .fn()
        .mockResolvedValue(new Map()),
    };
    productionItemRepository = {
      sumProducedPlannedCostByCompanyAndWindows: jest
        .fn()
        .mockResolvedValue(new Map()),
    };
    expenseRepository = {
      findAllByCompanyIdAndDayWindows: jest.fn().mockResolvedValue(new Map()),
    };
    stockMovementRepository = {
      sumUnitCostByCompanyAndWindowsAndReason: jest
        .fn()
        .mockResolvedValue(new Map()),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindCashRegisterReportUseCase(
      sessionRepository as unknown as CashRegisterSessionRepository,
      movementRepository as unknown as CashRegisterMovementRepository,
      saleItemRepository as unknown as SaleItemRepository,
      productionItemRepository as unknown as DailyProductionItemRepository,
      expenseRepository as unknown as ExpenseRepository,
      stockMovementRepository as unknown as StockMovementRepository,
      loggedUserService,
    );
  });

  it('should return a zeroed summary when there are no sessions in the period', async () => {
    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.sessions).toEqual([]);
    expect(output.summary).toEqual({
      sessionsCount: 0,
      totalOpeningAmount: 0,
      totalSales: 0,
      costOfSold: 0,
      totalProductionCost: 0,
      totalExpenses: 0,
      totalWaste: 0,
      totalRecoveredAtCost: 0,
      totalSupplies: 0,
      totalWithdrawals: 0,
      totalProfit: 0,
    });
  });

  it('should scope the sessions query to the logged user company and date range', async () => {
    await sut.execute({ dateFrom, dateTo });

    expect(sessionRepository.findAllByCompanyIdAndDateRange).toHaveBeenCalledWith(
      'company-1',
      dateFrom,
      dateTo,
    );
  });

  it('should fetch every data source once in batch, no matter how many sessions there are', async () => {
    sessionRepository.findAllByCompanyIdAndDateRange.mockResolvedValue([
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
      makeSession({ id: 's3' }),
    ]);

    await sut.execute({ dateFrom, dateTo });

    expect(
      saleItemRepository.sumRevenueAndCostByCashRegisterSessionIds,
    ).toHaveBeenCalledTimes(1);
    expect(
      saleItemRepository.sumRevenueAndCostByCashRegisterSessionIds,
    ).toHaveBeenCalledWith(['s1', 's2', 's3']);
    expect(
      productionItemRepository.sumProducedPlannedCostByCompanyAndWindows,
    ).toHaveBeenCalledTimes(1);
    expect(expenseRepository.findAllByCompanyIdAndDayWindows).toHaveBeenCalledTimes(
      1,
    );
    // uma chamada por motivo (WASTE e LEFTOVER_SOLD_AT_COST)
    expect(
      stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason,
    ).toHaveBeenCalledTimes(2);
    // uma chamada por tipo (SUPPLY e WITHDRAWAL)
    expect(
      movementRepository.sumAmountByCashRegisterSessionIdsAndType,
    ).toHaveBeenCalledTimes(2);
  });

  it('should ask the stock movements for each reason with the session windows', async () => {
    const openedAt = new Date('2026-08-09T08:00:00Z');
    const closedAt = new Date('2026-08-09T18:00:00Z');
    sessionRepository.findAllByCompanyIdAndDateRange.mockResolvedValue([
      makeSession({ id: 's1', openedAt, closedAt }),
    ]);

    await sut.execute({ dateFrom, dateTo });

    const windows = [{ id: 's1', dateFrom: openedAt, dateTo: closedAt }];
    expect(
      stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason,
    ).toHaveBeenCalledWith('company-1', windows, [TypeStockMovementReason.WASTE]);
    expect(
      stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason,
    ).toHaveBeenCalledWith('company-1', windows, [
      TypeStockMovementReason.LEFTOVER_SOLD_AT_COST,
    ]);
    expect(
      movementRepository.sumAmountByCashRegisterSessionIdsAndType,
    ).toHaveBeenCalledWith(['s1'], TypeCashRegisterMovement.SUPPLY);
    expect(
      movementRepository.sumAmountByCashRegisterSessionIdsAndType,
    ).toHaveBeenCalledWith(['s1'], TypeCashRegisterMovement.WITHDRAWAL);
  });

  it('should compute each session profit as sales + recovered − production − waste − expenses', async () => {
    sessionRepository.findAllByCompanyIdAndDateRange.mockResolvedValue([
      makeSession({ id: 's1', openingAmount: 100 }),
    ]);
    saleItemRepository.sumRevenueAndCostByCashRegisterSessionIds.mockResolvedValue(
      new Map([['s1', { totalRevenue: 500, totalCost: 200 }]]),
    );
    productionItemRepository.sumProducedPlannedCostByCompanyAndWindows.mockResolvedValue(
      new Map([['s1', 120]]),
    );
    expenseRepository.findAllByCompanyIdAndDayWindows.mockResolvedValue(
      new Map([['s1', [makeExpense('e1', 30), makeExpense('e2', 20)]]]),
    );
    stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason.mockImplementation(
      async (_companyId, _windows, reasons) =>
        reasons[0] === TypeStockMovementReason.WASTE
          ? new Map([['s1', 40]])
          : new Map([['s1', 15]]),
    );
    movementRepository.sumAmountByCashRegisterSessionIdsAndType.mockImplementation(
      async (_ids, type) =>
        type === TypeCashRegisterMovement.SUPPLY
          ? new Map([['s1', 70]])
          : new Map([['s1', 25]]),
    );

    const output = await sut.execute({ dateFrom, dateTo });

    // 500 + 15 − 120 − 40 − 50 = 305
    expect(output.sessions[0]).toMatchObject({
      id: 's1',
      openingAmount: 100,
      totalSales: 500,
      costOfSold: 200,
      productionCost: 120,
      totalExpenses: 50,
      totalWaste: 40,
      totalRecoveredAtCost: 15,
      totalSupplies: 70,
      totalWithdrawals: 25,
      profit: 305,
    });
    expect(output.sessions[0].expenses.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(output.summary).toMatchObject({
      sessionsCount: 1,
      totalSales: 500,
      totalProfit: 305,
    });
  });

  it('should treat a session missing from every batch result as zeros', async () => {
    sessionRepository.findAllByCompanyIdAndDateRange.mockResolvedValue([
      makeSession({ id: 'empty', openingAmount: 0 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.sessions[0]).toMatchObject({
      totalSales: 0,
      costOfSold: 0,
      productionCost: 0,
      totalExpenses: 0,
      totalWaste: 0,
      totalRecoveredAtCost: 0,
      totalSupplies: 0,
      totalWithdrawals: 0,
      profit: 0,
      expenses: [],
    });
  });

  it('should not mix data between sessions', async () => {
    sessionRepository.findAllByCompanyIdAndDateRange.mockResolvedValue([
      makeSession({ id: 's1', openingAmount: 10 }),
      makeSession({ id: 's2', openingAmount: 20 }),
    ]);
    saleItemRepository.sumRevenueAndCostByCashRegisterSessionIds.mockResolvedValue(
      new Map([
        ['s1', { totalRevenue: 100, totalCost: 40 }],
        ['s2', { totalRevenue: 300, totalCost: 90 }],
      ]),
    );

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.sessions.map((s) => [s.id, s.totalSales])).toEqual([
      ['s1', 100],
      ['s2', 300],
    ]);
    expect(output.summary).toMatchObject({
      sessionsCount: 2,
      totalOpeningAmount: 30,
      totalSales: 400,
      costOfSold: 130,
    });
  });
});
