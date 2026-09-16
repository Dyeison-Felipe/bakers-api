import { FindStockMovementsUseCase } from '../usecase/find-stock-movements.usecase';
import { TypeStockMovement, TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import type { StockMovementRepository, StockMovementReportItem } from '../../domain/repositories/stock-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindStockMovementsUseCase', () => {
  let stockMovementRepository: jest.Mocked<
    Pick<StockMovementRepository, 'findAllByCompanyAndDateAndReason'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindStockMovementsUseCase;

  const dateFrom = new Date('2026-01-01T00:00:00Z');
  const dateTo = new Date('2026-01-31T23:59:59Z');

  const makeItem = (
    overrides: Partial<StockMovementReportItem> = {},
  ): StockMovementReportItem => ({
    id: 'movement-1',
    createdAt: new Date(),
    productId: 'product-1',
    productName: 'Farinha',
    quantity: 5,
    unitOfMeasurement: 'KG' as never,
    unitCostSnapshot: 2,
    totalCost: 10,
    type: TypeStockMovement.EXIT,
    reason: TypeStockMovementReason.PRODUCTION,
    reasonDescription: null,
    ...overrides,
  });

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

    sut = new FindStockMovementsUseCase(
      stockMovementRepository as unknown as StockMovementRepository,
      loggedUserService,
    );
  });

  it('should query all reasons when no reason filter is given', async () => {
    await sut.execute({ dateFrom, dateTo });

    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenCalledWith(
      'company-1',
      dateFrom,
      dateTo,
      Object.values(TypeStockMovementReason),
    );
  });

  it('should query only the given reason when one is provided', async () => {
    await sut.execute({ dateFrom, dateTo, reason: TypeStockMovementReason.WASTE });

    expect(stockMovementRepository.findAllByCompanyAndDateAndReason).toHaveBeenCalledWith(
      'company-1',
      dateFrom,
      dateTo,
      [TypeStockMovementReason.WASTE],
    );
  });

  it('should return the items from the repository', async () => {
    const item = makeItem();
    stockMovementRepository.findAllByCompanyAndDateAndReason.mockResolvedValue([item]);

    const output = await sut.execute({ dateFrom, dateTo });

    expect(output).toEqual({ items: [item] });
  });
});
