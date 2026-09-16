import { FindAbcCurveReportUseCase } from '../usecase/find-abc-curve-report.usecase';
import type {
  SaleItemRepository,
  ProductRevenueAndCost,
} from '@/core/sale/domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAbcCurveReportUseCase', () => {
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'findRevenueAndCostByProductAndDateRange'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAbcCurveReportUseCase;

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

    sut = new FindAbcCurveReportUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      loggedUserService,
    );
  });

  it('should sort products by revenue descending and compute cumulative percent', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p-small', revenue: 20 }),
      makeRow({ productId: 'p-big', revenue: 80 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.totalRevenue).toBe(100);
    expect(output.items.map((item) => item.productId)).toEqual(['p-big', 'p-small']);
    expect(output.items[0].revenuePercent).toBe(80);
    expect(output.items[0].cumulativePercent).toBe(80);
    expect(output.items[1].cumulativePercent).toBe(100);
  });

  it('should classify products as A up to 80% cumulative revenue', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 80 }),
      makeRow({ productId: 'p2', revenue: 20 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    // p1: 80/100 = 80% acumulado -> A (limite inclusivo)
    expect(output.items[0].classification).toBe('A');
  });

  it('should classify products as B between 80% and 95% cumulative revenue', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 85 }),
      makeRow({ productId: 'p2', revenue: 15 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    // p1: 85/100 = 85% acumulado -> B; p2: 100% acumulado -> C
    expect(output.items[0].classification).toBe('B');
    expect(output.items[1].classification).toBe('C');
  });

  it('should classify the remaining products as C above 95% cumulative revenue', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 90 }),
      makeRow({ productId: 'p2', revenue: 10 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    // p1: 90% acumulado -> B; p2: 100% acumulado -> C
    expect(output.items[1].classification).toBe('C');
  });

  it('should return an empty report with zero total when there are no sales', async () => {
    const output = await sut.execute({ dateFrom, dateTo });

    expect(output).toEqual({ totalRevenue: 0, items: [] });
  });
});
