import { UpdateCategoryByCompanyUseCase } from '../usecase/update-category.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeCategory, makeLoggedUser } from './fixtures';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('UpdateCategoryByCompanyUseCase', () => {
  let categoryRepository: jest.Mocked<
    Pick<CategoryRepository, 'findCategoryByIdAndCompanyId' | 'update'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: UpdateCategoryByCompanyUseCase;

  beforeEach(() => {
    categoryRepository = {
      findCategoryByIdAndCompanyId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new UpdateCategoryByCompanyUseCase(
      categoryRepository as unknown as CategoryRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the category does not exist for the logged company', async () => {
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ id: 'category-1', name: 'Novo nome' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when a category (that already has a parent) is assigned to itself', async () => {
    // a checagem de auto-referência só roda quando a categoria já tem um pai
    // (`parent` truthy) — ver UpdateCategoryByCompanyUseCase.execute
    const category = makeCategory({
      id: 'category-1',
      parent: { id: 'existing-parent', name: 'Padaria' },
    });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);

    await expect(
      sut.execute({ id: 'category-1', name: 'Nome', parentId: 'category-1' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should re-resolve the parent when changing to a different existing parent', async () => {
    const category = makeCategory({
      id: 'category-1',
      parent: { id: 'old-parent', name: 'Antigo' },
    });
    const newParent = makeCategory({ id: 'new-parent', name: 'Novo pai' });
    categoryRepository.findCategoryByIdAndCompanyId.mockImplementation((id) =>
      Promise.resolve(id === 'category-1' ? category : newParent),
    );

    const output = await sut.execute({
      id: 'category-1',
      name: 'Nome',
      parentId: 'new-parent',
    });

    expect(output.parentId).toBe('new-parent');
  });

  it('should throw NotFoundError when the new parentId does not exist', async () => {
    const category = makeCategory({
      id: 'category-1',
      parent: { id: 'old-parent', name: 'Antigo' },
    });
    categoryRepository.findCategoryByIdAndCompanyId.mockImplementation((id) =>
      Promise.resolve(id === 'category-1' ? category : null),
    );

    await expect(
      sut.execute({ id: 'category-1', name: 'Nome', parentId: 'missing' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should update the category name', async () => {
    const category = makeCategory({ name: 'Antigo' });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);

    const output = await sut.execute({ id: category.id, name: 'Novo' });

    expect(output.name).toBe('Novo');
    expect(categoryRepository.update).toHaveBeenCalledWith(category);
  });

  it('should return null parentId when the category has no parent', async () => {
    const category = makeCategory({ parent: null });
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(category);

    const output = await sut.execute({ id: category.id, name: 'Nome' });

    expect(output.parentId).toBeNull();
  });
});
