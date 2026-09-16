import { FindCpvReportUseCase } from '../usecase/find-cpv-report.usecase';
import type {
  SaleItemRepository,
  ProductRevenueAndCost,
} from '@/core/sale/domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCpvReportUseCase', () => {
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'findRevenueAndCostByProductAndDateRange'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCpvReportUseCase;

  const dateFrom = new Date('2026-01-01T00:00:00Z');
  const dateTo = new Date('2026-01-31T23:59:59Z');

  const makeRow = (
    overrides: Partial<ProductRevenueAndCost> = {},
  ): ProductRevenueAndCost => ({
    productId: 'product-1',
    productName: 'Pão Francês',
    quantitySold: 10,
    revenue: 100,
    cost: 60,
    ...overrides,
  });

  beforeEach(() => {
    saleItemRepository = {
      findRevenueAndCostByProductAndDateRange: jest.fn().mockResolvedValue([]),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindCpvReportUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      loggedUserService,
    );
  });

  it('should query the repository scoped to the logged user company and date range', async () => {
    await sut.execute({ dateFrom, dateTo });

    expect(
      saleItemRepository.findRevenueAndCostByProductAndDateRange,
    ).toHaveBeenCalledWith('company-1', dateFrom, dateTo);
  });

  it('should compute totals and gross profit from the per-product rows', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 100, cost: 60 }),
      makeRow({ productId: 'p2', revenue: 50, cost: 20 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.totalRevenue).toBe(150);
    expect(output.totalCpv).toBe(80);
    expect(output.grossProfit).toBe(70);
  });

  it('should compute gross profit per item as revenue minus cpv', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 100, cost: 60 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items[0].grossProfit).toBe(40);
  });

  it('should sort items by CPV descending', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'low-cpv', cost: 10 }),
      makeRow({ productId: 'high-cpv', cost: 90 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items.map((item) => item.productId)).toEqual([
      'high-cpv',
      'low-cpv',
    ]);
  });

  it('should return zeroed totals when there are no sales in the period', async () => {
    const output = await sut.execute({ dateFrom, dateTo });

    expect(output).toEqual({
      totalRevenue: 0,
      totalCpv: 0,
      grossProfit: 0,
      items: [],
    });
  });
});
