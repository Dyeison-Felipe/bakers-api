import { FindAllProductByCompanyUseCase } from '../usecase/find-all-product-by-company.usecase';
import { makeLoggedUser, makePagination, makeProduct } from './fixtures';
import { ProductStatus } from '@/shared/infra/enums/product';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllProductByCompanyUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findAllProductsByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllProductByCompanyUseCase;

  beforeEach(() => {
    productRepository = {
      findAllProductsByCompanyId: jest.fn().mockResolvedValue(makePagination([])),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllProductByCompanyUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should resolve status ATIVO to true', async () => {
    await sut.execute({ status: ProductStatus.ATIVO });

    expect(productRepository.findAllProductsByCompanyId).toHaveBeenCalledWith(
      'company-1',
      true,
      undefined,
      undefined,
      { page: undefined, limit: undefined },
      undefined,
    );
  });

  it('should resolve status INATIVO to false', async () => {
    await sut.execute({ status: ProductStatus.INATIVO });

    expect(productRepository.findAllProductsByCompanyId).toHaveBeenCalledWith(
      'company-1',
      false,
      undefined,
      undefined,
      { page: undefined, limit: undefined },
      undefined,
    );
  });

  it('should resolve status TODOS to undefined', async () => {
    await sut.execute({ status: ProductStatus.TODOS });

    expect(productRepository.findAllProductsByCompanyId).toHaveBeenCalledWith(
      'company-1',
      undefined,
      undefined,
      undefined,
      { page: undefined, limit: undefined },
      undefined,
    );
  });

  it('should default status to true when none is informed', async () => {
    await sut.execute({});

    expect(productRepository.findAllProductsByCompanyId).toHaveBeenCalledWith(
      'company-1',
      true,
      undefined,
      undefined,
      { page: undefined, limit: undefined },
      undefined,
    );
  });

  it('should forward page and limit to the repository', async () => {
    await sut.execute({ page: 2, limit: 50 });

    expect(productRepository.findAllProductsByCompanyId).toHaveBeenCalledWith(
      'company-1',
      true,
      undefined,
      undefined,
      { page: 2, limit: 50 },
      undefined,
    );
  });

  it('should map each product and its category to the output shape', async () => {
    productRepository.findAllProductsByCompanyId.mockResolvedValue(
      makePagination([
        makeProduct({ category: { id: 'category-1', name: 'Pães', parent: null } }),
      ]),
    );

    const output = await sut.execute({});

    expect(output.items[0].category).toEqual({
      id: 'category-1',
      name: 'Pães',
      parentId: null,
      children: [],
    });
  });
});
