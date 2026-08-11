import { UpdateStockProductUseCase } from '../usecase/increase-decrease-stock-product.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('UpdateStockProductUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findProductByIdAndCompanyId' | 'update'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: UpdateStockProductUseCase;

  beforeEach(() => {
    productRepository = {
      findProductByIdAndCompanyId: jest.fn().mockResolvedValue(makeProduct({ currentStock: 10 })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new UpdateStockProductUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the product does not exist', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ productId: 'product-1', type: TypeOperationStock.INCREASE, value: 1 }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should no-op and not update the product when it has no stock management', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ stockManagement: false }),
    );

    const output = await sut.execute({
      productId: 'product-1',
      type: TypeOperationStock.INCREASE,
      value: 1,
    });

    expect(output).toEqual({ id: 'product-1' });
    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it('should increase current stock', async () => {
    await sut.execute({ productId: 'product-1', type: TypeOperationStock.INCREASE, value: 5 });

    const updated = productRepository.update.mock.calls[0][0];
    expect(updated.currentStock).toBe(15);
  });

  it('should decrease current stock', async () => {
    await sut.execute({ productId: 'product-1', type: TypeOperationStock.DECREASE, value: 4 });

    const updated = productRepository.update.mock.calls[0][0];
    expect(updated.currentStock).toBe(6);
  });

  it('should treat a null current stock as zero when increasing', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ currentStock: null }),
    );

    await sut.execute({ productId: 'product-1', type: TypeOperationStock.INCREASE, value: 5 });

    const updated = productRepository.update.mock.calls[0][0];
    expect(updated.currentStock).toBe(5);
  });

  it('should throw BadRequestError when decreasing more than the current stock', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ currentStock: 3 }),
    );

    await expect(
      sut.execute({ productId: 'product-1', type: TypeOperationStock.DECREASE, value: 4 }),
    ).rejects.toThrow(BadRequestError);
  });
});
