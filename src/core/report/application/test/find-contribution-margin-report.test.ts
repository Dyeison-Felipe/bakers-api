import { FindContributionMarginReportUseCase } from '../usecase/find-contribution-margin-report.usecase';
import type {
  SaleItemRepository,
  ProductRevenueAndCost,
} from '@/core/sale/domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindContributionMarginReportUseCase', () => {
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'findRevenueAndCostByProductAndDateRange'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindContributionMarginReportUseCase;

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

    sut = new FindContributionMarginReportUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      loggedUserService,
    );
  });

  it('should forward the product/category/type filters to the repository', async () => {
    await sut.execute({
      dateFrom,
      dateTo,
      productId: 'product-1',
      categoryId: 'category-1',
      typeProduct: 'OWN_PRODUCTION' as never,
    });

    expect(
      saleItemRepository.findRevenueAndCostByProductAndDateRange,
    ).toHaveBeenCalledWith('company-1', dateFrom, dateTo, {
      productId: 'product-1',
      categoryId: 'category-1',
      typeProduct: 'OWN_PRODUCTION',
    });
  });

  it('should compute contribution margin and percent per product', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 100, cost: 60 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items[0]).toEqual(
      expect.objectContaining({
        productId: 'p1',
        revenue: 100,
        variableCost: 60,
        contributionMargin: 40,
        contributionMarginPercent: 40,
      }),
    );
  });

  it('should return zero percent when revenue is zero (avoid division by zero)', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 0, cost: 0 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items[0].contributionMarginPercent).toBe(0);
  });

  it('should sort items by contribution margin descending', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'low-margin', revenue: 100, cost: 90 }),
      makeRow({ productId: 'high-margin', revenue: 100, cost: 10 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items.map((item) => item.productId)).toEqual([
      'high-margin',
      'low-margin',
    ]);
  });

  it('should compute the totals as the sum across all products', async () => {
    saleItemRepository.findRevenueAndCostByProductAndDateRange.mockResolvedValue([
      makeRow({ productId: 'p1', revenue: 100, cost: 60 }),
      makeRow({ productId: 'p2', revenue: 50, cost: 20 }),
    ]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.totalRevenue).toBe(150);
    expect(output.totalVariableCost).toBe(80);
    expect(output.totalContributionMargin).toBe(70);
  });
});
