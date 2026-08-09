import { FindAllCategoriesByCompanyUseCase } from '../usecase/find-all-categories.usecase';
import { makeLoggedUser, makePagination } from './fixtures';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllCategoriesByCompanyUseCase', () => {
  let categoryRepository: jest.Mocked<Pick<CategoryRepository, 'findAllByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllCategoriesByCompanyUseCase;

  beforeEach(() => {
    categoryRepository = { findAllByCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllCategoriesByCompanyUseCase(
      categoryRepository as unknown as CategoryRepository,
      loggedUserService,
    );
  });

  it('should scope the query by the logged user company id and forward pagination', async () => {
    categoryRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    await sut.execute({ pagination: { page: 2, limit: 5 } });

    expect(categoryRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { page: 2, limit: 5 },
    );
  });

  it('should return root categories flat when none of them have a parent', async () => {
    const categories = [
      { id: 'c1', name: 'Pães', parent: null },
      { id: 'c2', name: 'Doces', parent: null },
    ];
    categoryRepository.findAllByCompanyId.mockResolvedValue(
      makePagination(categories as never),
    );

    const output = await sut.execute({});

    expect(output.items).toEqual([
      { id: 'c1', name: 'Pães', parentId: null, children: [] },
      { id: 'c2', name: 'Doces', parentId: null, children: [] },
    ]);
  });

  it('should nest a category under its parent when both are in the result set', async () => {
    const categories = [
      { id: 'root-1', name: 'Padaria', parent: null },
      { id: 'child-1', name: 'Pão francês', parent: { id: 'root-1', name: 'Padaria' } },
    ];
    categoryRepository.findAllByCompanyId.mockResolvedValue(
      makePagination(categories as never),
    );

    const output = await sut.execute({});

    expect(output.items).toEqual([
      {
        id: 'root-1',
        name: 'Padaria',
        parentId: null,
        children: [{ id: 'child-1', name: 'Pão francês', parentId: 'root-1', children: [] }],
      },
    ]);
  });

  it('should treat a category as root when its parent is not present in the result set', async () => {
    const categories = [
      { id: 'orphan-1', name: 'Órfã', parent: { id: 'missing-parent', name: 'X' } },
    ];
    categoryRepository.findAllByCompanyId.mockResolvedValue(
      makePagination(categories as never),
    );

    const output = await sut.execute({});

    expect(output.items).toHaveLength(1);
    expect(output.items[0].id).toBe('orphan-1');
  });

  it('should preserve pagination meta from the repository', async () => {
    const pagination = makePagination([]);
    categoryRepository.findAllByCompanyId.mockResolvedValue(pagination);

    const output = await sut.execute({});

    expect(output.meta).toEqual(pagination.meta);
  });
});
