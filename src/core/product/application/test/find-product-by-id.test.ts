import { FindProductByIdAndCompanyId } from '../usecase/find-product-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindProductByIdAndCompanyId', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findProductByIdAndCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindProductByIdAndCompanyId;

  beforeEach(() => {
    productRepository = { findProductByIdAndCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindProductByIdAndCompanyId(
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the product does not exist for the logged company', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should scope the search by the logged user company id', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(makeProduct());

    await sut.execute({ productId: 'product-1' });

    expect(productRepository.findProductByIdAndCompanyId).toHaveBeenCalledWith(
      'product-1',
      'company-1',
    );
  });

  it('should map the product and its category to the output shape', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ category: { id: 'category-1', name: 'Pães', parent: { id: 'parent-1' } } }),
    );

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.category).toEqual({
      id: 'category-1',
      name: 'Pães',
      parentId: 'parent-1',
      children: [],
    });
  });
});
