import { FindAllUsersUseCase } from '../usecase/find-all-users.usecase';
import { makeLoggedUser, makeUser } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const makePagination = <T>(items: T[]) => ({
  items,
  meta: {
    totalItems: items.length,
    itemCount: items.length,
    itemsPerPage: 10,
    totalPages: 1,
    currentPage: 1,
  },
});

describe('FindAllUsersUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findAllByCompany'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllUsersUseCase;

  beforeEach(() => {
    userRepository = { findAllByCompany: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllUsersUseCase(
      userRepository as unknown as UserRepository,
      loggedUserService,
    );
  });

  it('should scope the query by the logged user company id and forward pagination', async () => {
    userRepository.findAllByCompany.mockResolvedValue(makePagination([]));

    await sut.execute({ pagination: { page: 2, limit: 5 } });

    expect(userRepository.findAllByCompany).toHaveBeenCalledWith('company-1', {
      page: 2,
      limit: 5,
    });
  });

  it('should map each user to the list output shape, preserving pagination meta', async () => {
    const user = makeUser({ active: false });
    const pagination = makePagination([user]);
    userRepository.findAllByCompany.mockResolvedValue(pagination);

    const output = await sut.execute({});

    expect(output.meta).toEqual(pagination.meta);
    expect(output.items).toEqual([
      {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        active: false,
        role: { id: user.role.id, name: user.role.name },
      },
    ]);
  });

  it('should return an empty items list when there are no users', async () => {
    userRepository.findAllByCompany.mockResolvedValue(makePagination([]));

    const output = await sut.execute({});

    expect(output.items).toEqual([]);
  });
});
