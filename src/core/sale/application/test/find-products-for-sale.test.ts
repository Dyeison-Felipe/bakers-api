import { FindProductsForSaleUseCase } from '../usecase/find-products-for-sale.usecase';
import { makeLoggedUser, makePagination, makeProduct } from './fixtures';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindProductsForSaleUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findEligibleForSale'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindProductsForSaleUseCase;

  beforeEach(() => {
    productRepository = { findEligibleForSale: jest.fn().mockResolvedValue(makePagination([])) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindProductsForSaleUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should scope the search by the logged user company id and forward search/pagination', async () => {
    await sut.execute({ search: 'pão', page: 2 });

    expect(productRepository.findEligibleForSale).toHaveBeenCalledWith('company-1', 'pão', {
      page: 2,
    });
  });

  it('should map each eligible product to the output shape', async () => {
    productRepository.findEligibleForSale.mockResolvedValue(makePagination([makeProduct()]));

    const output = await sut.execute({});

    expect(output.items).toEqual([
      {
        id: 'product-1',
        name: 'Pão Francês',
        barCode: null,
        unitOfMeasurement: 'un',
        salePrice: 1,
        unitCostPrice: 0.5,
        pricePerKilogram: 8,
        currentStock: 50,
        stockManagement: true,
        imagePath: null,
      },
    ]);
  });
});
