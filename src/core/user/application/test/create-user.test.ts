import { CreateUserUseCase } from '../usecase/create-user.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompany, makeLoggedUser, makePermission, makeRole, makeUser } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { HashService } from '@/shared/application/hash/hash.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import type { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import type { RoleRepository } from '@/core/role/domain/repositories/role.repository';

describe('CreateUserUseCase', () => {
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findByEmail' | 'findByUsernameAndCompany' | 'save'>
  >;
  let hashService: jest.Mocked<HashService>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let userPermissionRepository: jest.Mocked<Pick<UserPermissionRepository, 'create'>>;
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findPermissionsById'>>;
  let roleRepository: jest.Mocked<Pick<RoleRepository, 'findById'>>;
  let sut: CreateUserUseCase;

  const baseInput = {
    username: 'joana',
    name: 'Joana Silva',
    email: 'joana@example.com',
    password: 'supersecret',
    role: 'role-1',
    permissionsId: ['permission-1'],
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsernameAndCompany: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compareHash: jest.fn(),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    userPermissionRepository = {
      create: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    permissionRepository = {
      findPermissionsById: jest.fn().mockResolvedValue([makePermission()]),
    };
    roleRepository = { findById: jest.fn().mockResolvedValue(makeRole()) };

    sut = new CreateUserUseCase(
      userRepository as unknown as UserRepository,
      hashService,
      loggedUserService,
      userPermissionRepository as unknown as UserPermissionRepository,
      permissionRepository as unknown as PermissionRepository,
      roleRepository as unknown as RoleRepository,
    );
  });

  it('should throw ConflictError when the email is already in use', async () => {
    userRepository.findByEmail.mockResolvedValue(makeUser());

    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictError);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when the username is already used in the same company', async () => {
    userRepository.findByUsernameAndCompany.mockResolvedValue(makeUser());

    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictError);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the role does not exist', async () => {
    roleRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the role belongs to a different company', async () => {
    roleRepository.findById.mockResolvedValue(
      makeRole({ company: makeCompany({ id: 'another-company' }) }),
    );

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when trying to assign the reserved Super Admin role, even within the same company', async () => {
    roleRepository.findById.mockResolvedValue(
      makeRole({ name: 'Super Admin', company: makeCompany({ id: 'company-1' }) }),
    );

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when none of the requested permissions exist', async () => {
    permissionRepository.findPermissionsById.mockResolvedValue([]);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should hash the password before saving the user', async () => {
    await sut.execute(baseInput);

    expect(hashService.hash).toHaveBeenCalledWith('supersecret');
    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.password).toBe('hashed-password');
  });

  it('should mark the user as email-verified immediately (no verification flow for admin-created users)', async () => {
    await sut.execute(baseInput);

    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.emailVerified).toBe(true);
  });

  it('should create one UserPermissionEntity per requested permission', async () => {
    const permissions = [makePermission({ id: 'p1' }), makePermission({ id: 'p2' })];
    permissionRepository.findPermissionsById.mockResolvedValue(permissions);

    await sut.execute(baseInput);

    expect(userPermissionRepository.create).toHaveBeenCalledTimes(2);
  });

  it('should return the full created user shape', async () => {
    const role = makeRole({ id: 'role-1', name: 'Funcionário' });
    const permission = makePermission({ id: 'permission-1' });
    roleRepository.findById.mockResolvedValue(role);
    permissionRepository.findPermissionsById.mockResolvedValue([permission]);

    const output = await sut.execute(baseInput);

    expect(output).toMatchObject({
      username: 'joana',
      name: 'Joana Silva',
      email: 'joana@example.com',
      role: { id: 'role-1', name: 'Funcionário' },
      permissions: [
        {
          id: 'permission-1',
          action: permission.action,
          subject: permission.subject,
          description: permission.description,
        },
      ],
    });
    expect(output.id).toEqual(expect.any(String));
  });
});
