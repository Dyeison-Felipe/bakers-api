import { FindUserByIdUseCase } from '../usecase/find-user-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompany, makeLoggedUser, makePermission, makeUser, makeUserPermission } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindUserByIdUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByIdWithPermissions'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindUserByIdUseCase;

  beforeEach(() => {
    userRepository = { findByIdWithPermissions: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser({ company: makeCompany({ id: 'company-1' }) })),
      setLoggedUser: jest.fn(),
    };

    sut = new FindUserByIdUseCase(
      userRepository as unknown as UserRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the user does not exist', async () => {
    userRepository.findByIdWithPermissions.mockResolvedValue(null);

    await expect(sut.execute({ id: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the user belongs to a different company (no cross-company leaking)', async () => {
    const user = makeUser({ company: makeCompany({ id: 'other-company' }) });
    userRepository.findByIdWithPermissions.mockResolvedValue(user);

    await expect(sut.execute({ id: user.id })).rejects.toThrow(NotFoundError);
  });

  it('should map the user, role and permissions to the detail output shape', async () => {
    const permission = makePermission({ id: 'permission-1' });
    const user = makeUser({
      company: makeCompany({ id: 'company-1' }),
      userPermissions: [makeUserPermission({ permission })],
    });
    userRepository.findByIdWithPermissions.mockResolvedValue(user);

    const output = await sut.execute({ id: user.id });

    expect(output).toEqual({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      active: user.active,
      role: { id: user.role.id, name: user.role.name },
      permissions: [
        {
          id: permission.id,
          action: permission.action,
          subject: permission.subject,
          description: permission.description,
        },
      ],
    });
  });

  it('should return an empty permissions array when the user has none', async () => {
    const user = makeUser({
      company: makeCompany({ id: 'company-1' }),
      userPermissions: [],
    });
    userRepository.findByIdWithPermissions.mockResolvedValue(user);

    const output = await sut.execute({ id: user.id });

    expect(output.permissions).toEqual([]);
  });
});
