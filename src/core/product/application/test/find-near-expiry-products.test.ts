import { FindNearExpiryProductsUseCase } from '../usecase/find-near-expiry-products.usecase';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type {
  StockMovementRepository,
  ProductLastEntryDate,
} from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('FindNearExpiryProductsUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findExpiringSoonByCompanyId'>>;
  let stockMovementRepository: jest.Mocked<
    Pick<StockMovementRepository, 'findLastEntryDateByProductIds'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindNearExpiryProductsUseCase;

  // Última entrada há `daysAgo` dias, com validade de `expirationDays` dias
  // a partir dela — dá `expirationDays - daysAgo` dias restantes.
  const lastEntry = (daysAgo: number): ProductLastEntryDate['lastEntryDate'] =>
    new Date(Date.now() - daysAgo * MS_PER_DAY);

  beforeEach(() => {
    productRepository = {
      findExpiringSoonByCompanyId: jest.fn().mockResolvedValue([]),
    };
    stockMovementRepository = {
      findLastEntryDateByProductIds: jest.fn().mockResolvedValue([]),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindNearExpiryProductsUseCase(
      productRepository as unknown as ProductRepository,
      stockMovementRepository as unknown as StockMovementRepository,
      loggedUserService,
    );
  });

  it('should scope the search by the logged user company id', async () => {
    await sut.execute();

    expect(productRepository.findExpiringSoonByCompanyId).toHaveBeenCalledWith('company-1');
  });

  it('should return an empty array when there are no candidate products', async () => {
    const output = await sut.execute();

    expect(output).toEqual([]);
    expect(stockMovementRepository.findLastEntryDateByProductIds).not.toHaveBeenCalled();
  });

  it('should include a product whose estimated expiry is within the threshold', async () => {
    const product = makeProduct({ id: 'p1', expirationDateInDays: '3' });
    productRepository.findExpiringSoonByCompanyId.mockResolvedValue([product]);
    stockMovementRepository.findLastEntryDateByProductIds.mockResolvedValue([
      { productId: 'p1', lastEntryDate: lastEntry(2) }, // vence em ~1 dia
    ]);

    const output = await sut.execute();

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(
      expect.objectContaining({ id: 'p1', daysUntilExpiry: expect.any(Number) }),
    );
    expect(output[0].daysUntilExpiry).toBeLessThanOrEqual(2);
  });

  it('should exclude a product whose estimated expiry is far in the future', async () => {
    const product = makeProduct({ id: 'p1', expirationDateInDays: '30' });
    productRepository.findExpiringSoonByCompanyId.mockResolvedValue([product]);
    stockMovementRepository.findLastEntryDateByProductIds.mockResolvedValue([
      { productId: 'p1', lastEntryDate: lastEntry(0) }, // vence em ~30 dias
    ]);

    const output = await sut.execute();

    expect(output).toEqual([]);
  });

  it('should exclude a product with no stock entry recorded (cannot estimate)', async () => {
    const product = makeProduct({ id: 'p1', expirationDateInDays: '3' });
    productRepository.findExpiringSoonByCompanyId.mockResolvedValue([product]);
    stockMovementRepository.findLastEntryDateByProductIds.mockResolvedValue([]);

    const output = await sut.execute();

    expect(output).toEqual([]);
  });

  it('should sort the most urgent products first', async () => {
    const soon = makeProduct({ id: 'soon', expirationDateInDays: '3' });
    const urgent = makeProduct({ id: 'urgent', expirationDateInDays: '2' });
    productRepository.findExpiringSoonByCompanyId.mockResolvedValue([soon, urgent]);
    stockMovementRepository.findLastEntryDateByProductIds.mockResolvedValue([
      { productId: 'soon', lastEntryDate: lastEntry(1.5) }, // ~1.5 dias restantes
      { productId: 'urgent', lastEntryDate: lastEntry(1.9) }, // ~0.1 dia restante
    ]);

    const output = await sut.execute();

    expect(output.map((item) => item.id)).toEqual(['urgent', 'soon']);
  });
});
