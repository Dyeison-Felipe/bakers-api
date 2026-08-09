import { FindDashboardSummaryUseCase } from '../usecase/find-dashboard-summary.usecase';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import type { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import type { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import type { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const makePagination = <T>(items: T[]) => ({
  items,
  meta: { totalItems: items.length, itemCount: items.length, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
});

describe('FindDashboardSummaryUseCase', () => {
  let saleRepository: jest.Mocked<
    Pick<SaleRepository, 'sumTotalByCompanyAndDateRangeAndPaymentMethod'>
  >;
  let dailyProductionRepository: jest.Mocked<Pick<DailyProductionRepository, 'findAllByCompanyId'>>;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let expenseRepository: jest.Mocked<Pick<ExpenseRepository, 'findAllByCompanyAndDate'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindDashboardSummaryUseCase;

  beforeEach(() => {
    saleRepository = {
      sumTotalByCompanyAndDateRangeAndPaymentMethod: jest.fn().mockResolvedValue(0),
    };
    dailyProductionRepository = {
      findAllByCompanyId: jest.fn().mockResolvedValue(makePagination([])),
    };
    dailyProductionItemRepository = {
      findAllByDailyProductionId: jest.fn().mockResolvedValue([]),
    };
    expenseRepository = { findAllByCompanyAndDate: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue({ company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindDashboardSummaryUseCase(
      saleRepository as unknown as SaleRepository,
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      expenseRepository as unknown as ExpenseRepository,
      loggedUserService,
    );
  });

  it('should return zeroed totals when there is no data for the day', async () => {
    const output = await sut.execute();

    expect(output).toEqual({
      productionCostToday: 0,
      salesRevenueCashToday: 0,
      salesRevenuePixToday: 0,
      salesRevenueCardToday: 0,
      expensesToday: 0,
    });
  });

  it('should sum revenue per payment method independently', async () => {
    saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod.mockImplementation(
      async (_companyId, _from, _to, method) => {
        if (method === TypePaymentMethod.CASH) return 10;
        if (method === TypePaymentMethod.PIX) return 20;
        if (method === TypePaymentMethod.CARD) return 30;
        return 0;
      },
    );

    const output = await sut.execute();

    expect(output.salesRevenueCashToday).toBe(10);
    expect(output.salesRevenuePixToday).toBe(20);
    expect(output.salesRevenueCardToday).toBe(30);
  });

  it('should sum plannedCost across every item of every daily production', async () => {
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([{ id: 'dp-1' } as never, { id: 'dp-2' } as never]),
    );
    dailyProductionItemRepository.findAllByDailyProductionId.mockImplementation(
      async (dailyProductionId) =>
        dailyProductionId === 'dp-1'
          ? ([{ plannedCost: 10 }] as never)
          : ([{ plannedCost: 5 }, { plannedCost: 2.5 }] as never),
    );

    const output = await sut.execute();

    expect(output.productionCostToday).toBe(17.5);
  });

  it('should sum expense values for the day', async () => {
    expenseRepository.findAllByCompanyAndDate.mockResolvedValue([
      { value: 12.5 } as never,
      { value: 7.5 } as never,
    ]);

    const output = await sut.execute();

    expect(output.expensesToday).toBe(20);
  });

  it('should scope every query by the logged user company id', async () => {
    await sut.execute();

    expect(
      saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod,
    ).toHaveBeenCalledWith('company-1', expect.any(Date), expect.any(Date), expect.any(String));
    expect(dailyProductionRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { productionDate: expect.any(Date) },
    );
    expect(expenseRepository.findAllByCompanyAndDate).toHaveBeenCalledWith(
      'company-1',
      expect.any(Date),
    );
  });
});
