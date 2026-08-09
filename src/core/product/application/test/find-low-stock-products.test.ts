import { FindLowStockProductsUseCase } from '../usecase/find-low-stock-products.usecase';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindLowStockProductsUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findLowStockByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindLowStockProductsUseCase;

  beforeEach(() => {
    productRepository = { findLowStockByCompanyId: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindLowStockProductsUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should scope the search by the logged user company id', async () => {
    await sut.execute();

    expect(productRepository.findLowStockByCompanyId).toHaveBeenCalledWith('company-1');
  });

  it('should map each low-stock product to the output shape', async () => {
    productRepository.findLowStockByCompanyId.mockResolvedValue([
      makeProduct({ id: 'product-1', currentStock: 2, stockMin: 5 }),
    ]);

    const output = await sut.execute();

    expect(output).toEqual([
      {
        id: 'product-1',
        name: 'Pão Francês',
        currentStock: 2,
        stockMin: 5,
        unitOfMeasurement: 'un',
      },
    ]);
  });

  it('should return an empty array when there are no low-stock products', async () => {
    const output = await sut.execute();

    expect(output).toEqual([]);
  });
});
