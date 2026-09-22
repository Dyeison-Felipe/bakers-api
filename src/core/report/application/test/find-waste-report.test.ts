import { FindWasteReportUseCase } from '../usecase/find-waste-report.usecase';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import type {
  StockMovementRepository,
  StockMovementReportItem,
} from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindWasteReportUseCase', () => {
  let stockMovementRepository: jest.Mocked<
    Pick<StockMovementRepository, 'findAllByCompanyAndDateAndReason'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindWasteReportUseCase;

  const dateFrom = new Date('2026-08-01T00:00:00Z');
  const dateTo = new Date('2026-08-31T23:59:59Z');

  beforeEach(() => {
    stockMovementRepository = {
      findAllByCompanyAndDateAndReason: jest.fn().mockResolvedValue([]),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindWasteReportUseCase(
      stockMovementRepository as unknown as StockMovementRepository,
      loggedUserService,
    );
  });

  it('should query both reasons scoped to the logged user company and date range, without filters by default', async () => {
    await sut.execute({ dateFrom, dateTo });

    const expectedFilters = {
      productId: undefined,
      categoryId: undefined,
      typeProduct: undefined,
    };
    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenCalledWith(
      'company-1',
      dateFrom,
      dateTo,
      [TypeStockMovementReason.WASTE],
      expectedFilters,
    );
    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenCalledWith(
      'company-1',
      dateFrom,
      dateTo,
      [TypeStockMovementReason.LEFTOVER_SOLD_AT_COST],
      expectedFilters,
    );
  });

  it('should forward the product/category/type filters to both reason queries', async () => {
    await sut.execute({
      dateFrom,
      dateTo,
      productId: 'product-1',
      categoryId: 'category-1',
    });

    const expectedFilters = {
      productId: 'product-1',
      categoryId: 'category-1',
      typeProduct: undefined,
    };
    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenNthCalledWith(
      1,
      'company-1',
      dateFrom,
      dateTo,
      [TypeStockMovementReason.WASTE],
      expectedFilters,
    );
    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenNthCalledWith(
      2,
      'company-1',
      dateFrom,
      dateTo,
      [TypeStockMovementReason.LEFTOVER_SOLD_AT_COST],
      expectedFilters,
    );
  });

  it('should sum totalCost from the returned rows into totalWaste', async () => {
    const row = (overrides: Partial<StockMovementReportItem>): StockMovementReportItem => ({
      id: 'm1',
      createdAt: new Date(),
      productId: 'p1',
      productName: 'Produto',
      quantity: 1,
      unitOfMeasurement: null,
      consumerUnit: null,
      unitCostSnapshot: 5,
      totalCost: 5,
      type: 'EXIT' as never,
      reason: TypeStockMovementReason.WASTE,
      reasonDescription: null,
      ...overrides,
    });

    stockMovementRepository.findAllByCompanyAndDateAndReason.mockImplementation(
      async (_c, _f, _t, reasons) =>
        reasons[0] === TypeStockMovementReason.WASTE
          ? [row({ totalCost: 10 }), row({ totalCost: 5 })]
          : [],
    );

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.totalWaste).toBe(15);
    expect(output.totalRecoveredAtCost).toBe(0);
  });
});
