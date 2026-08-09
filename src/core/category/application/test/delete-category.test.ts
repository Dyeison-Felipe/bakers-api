import { DeleteCategoryByCompanyUseCase } from '../usecase/delete-category.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { makeCategory, makeLoggedUser } from './fixtures';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { ProductQueryRepository } from '@/core/product/application/queries/product.query';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('DeleteCategoryByCompanyUseCase', () => {
  let categoryRepository: jest.Mocked<
    Pick<CategoryRepository, 'findCategoryByIdAndCompanyId' | 'findChildrenByParentId' | 'deleteMany'>
  >;
  let productQueryRepository: jest.Mocked<
    Pick<ProductQueryRepository, 'findCategoryIdsWithLinkedProducts'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: DeleteCategoryByCompanyUseCase;

  beforeEach(() => {
    categoryRepository = {
      findCategoryByIdAndCompanyId: jest.fn(),
      findChildrenByParentId: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue(undefined),
    };
    productQueryRepository = {
      findCategoryIdsWithLinkedProducts: jest.fn().mockResolvedValue([]),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new DeleteCategoryByCompanyUseCase(
      categoryRepository as unknown as CategoryRepository,
      productQueryRepository as unknown as ProductQueryRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the category does not exist for the logged company', async () => {
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'category-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError when the category itself has linked products', async () => {
    const category = makeCategory({ id: 'category-1' });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);
    productQueryRepository.findCategoryIdsWithLinkedProducts.mockResolvedValue([
      'category-1',
    ]);

    await expect(sut.execute({ id: 'category-1' })).rejects.toThrow(ConflictError);
    expect(categoryRepository.deleteMany).not.toHaveBeenCalled();
  });

  it('should throw ConflictError naming the affected subcategories when a child has linked products', async () => {
    const category = makeCategory({ id: 'category-1' });
    const child = makeCategory({ id: 'child-1', name: 'Sub A' });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);
    categoryRepository.findChildrenByParentId.mockResolvedValue([child]);
    productQueryRepository.findCategoryIdsWithLinkedProducts.mockResolvedValue([
      'child-1',
    ]);

    await expect(sut.execute({ id: 'category-1' })).rejects.toThrow(
      /Sub A/,
    );
  });

  it('should delete the category and all its children when nothing is linked', async () => {
    const category = makeCategory({ id: 'category-1' });
    const child = makeCategory({ id: 'child-1' });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);
    categoryRepository.findChildrenByParentId.mockResolvedValue([child]);

    await sut.execute({ id: 'category-1' });

    expect(categoryRepository.deleteMany).toHaveBeenCalledWith([
      'category-1',
      'child-1',
    ]);
  });
});
