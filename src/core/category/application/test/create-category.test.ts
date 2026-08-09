import { CreateCategoryUseCase } from '../usecase/create-category.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCategory, makeLoggedUser } from './fixtures';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CreateCategoryUseCase', () => {
  let categoryRepository: jest.Mocked<
    Pick<CategoryRepository, 'findCategoryByNameAndCompanyId' | 'findById' | 'save'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CreateCategoryUseCase;

  beforeEach(() => {
    categoryRepository = {
      findCategoryByNameAndCompanyId: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new CreateCategoryUseCase(
      categoryRepository as unknown as CategoryRepository,
      loggedUserService,
    );
  });

  it('should throw ConflictError when a category with the same name already exists in the company', async () => {
    categoryRepository.findCategoryByNameAndCompanyId.mockResolvedValue(
      makeCategory(),
    );

    await expect(sut.execute({ name: 'Pães' })).rejects.toThrow(ConflictError);
    expect(categoryRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when parentId is informed but does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({ name: 'Doces', parentId: 'missing-parent' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should create a root category when no parentId is informed', async () => {
    const output = await sut.execute({ name: 'Pães' });

    expect(output.parentId).toBeNull();
    const savedCategory = categoryRepository.save.mock.calls[0][0];
    expect(savedCategory.parent).toBeNull();
  });

  it('should link the category to the found parent', async () => {
    const parent = makeCategory({ id: 'parent-1', name: 'Padaria' });
    categoryRepository.findById.mockResolvedValue(parent);

    const output = await sut.execute({ name: 'Pão francês', parentId: 'parent-1' });

    expect(output.parentId).toBe('parent-1');
  });
});
