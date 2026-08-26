import { UpdateUserUseCase } from '../usecase/update-user.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeLoggedUser, makePermission, makeRole, makeUser, makeUserPermission } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { HashService } from '@/shared/application/hash/hash.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import type { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import type { RoleRepository } from '@/core/role/domain/repositories/role.repository';

describe('UpdateUserUseCase', () => {
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findById' | 'findByUsernameAndCompany' | 'update'>
  >;
  let hashService: jest.Mocked<HashService>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let userPermissionRepository: jest.Mocked<
    Pick<UserPermissionRepository, 'create' | 'softDelete'>
  >;
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findPermissionsById'>>;
  let roleRepository: jest.Mocked<Pick<RoleRepository, 'findById'>>;
  let sut: UpdateUserUseCase;

  const baseInput = {
    id: 'user-1',
    username: 'joana',
    name: 'Joana Silva',
    email: 'joana@example.com',
    role: 'role-1',
    permissionsId: ['permission-1'],
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn().mockResolvedValue(makeUser()),
      findByUsernameAndCompany: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('new-hashed-password'),
      compareHash: jest.fn(),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    userPermissionRepository = {
      create: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    permissionRepository = {
      findPermissionsById: jest.fn().mockResolvedValue([makePermission({ id: 'permission-1' })]),
    };
    roleRepository = { findById: jest.fn().mockResolvedValue(makeRole()) };

    sut = new UpdateUserUseCase(
      userRepository as unknown as UserRepository,
      hashService,
      loggedUserService,
      userPermissionRepository as unknown as UserPermissionRepository,
      permissionRepository as unknown as PermissionRepository,
      roleRepository as unknown as RoleRepository,
    );
  });

  it('should throw NotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the role does not exist', async () => {
    roleRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when none of the requested permissions exist', async () => {
    permissionRepository.findPermissionsById.mockResolvedValue([]);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should not check username uniqueness when the username is unchanged', async () => {
    const user = makeUser({ username: 'joana' });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ ...baseInput, username: 'joana' });

    expect(userRepository.findByUsernameAndCompany).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when the new username collides with another user in the company', async () => {
    const user = makeUser({ id: 'user-1', username: 'joana' });
    userRepository.findById.mockResolvedValue(user);
    userRepository.findByUsernameAndCompany.mockResolvedValue(
      makeUser({ id: 'user-2', username: 'joana2' }),
    );

    await expect(
      sut.execute({ ...baseInput, username: 'joana2' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should allow the username change when the collision found is the same user being updated', async () => {
    const user = makeUser({ id: 'user-1', username: 'joana' });
    userRepository.findById.mockResolvedValue(user);
    userRepository.findByUsernameAndCompany.mockResolvedValue(
      makeUser({ id: 'user-1', username: 'joana2' }),
    );

    await expect(
      sut.execute({ ...baseInput, username: 'joana2' }),
    ).resolves.toBeDefined();
  });

  it('should update the password only when a new one is informed', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ ...baseInput, password: undefined });

    expect(hashService.hash).not.toHaveBeenCalled();
  });

  it('should hash and update the password when informed', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ ...baseInput, password: 'new-password' });

    expect(hashService.hash).toHaveBeenCalledWith('new-password');
    expect(user.password).toBe('new-hashed-password');
  });

  it('should throw BadRequestError when a user tries to change their own role', async () => {
    const user = makeUser({ id: 'admin-1', role: makeRole({ id: 'role-1' }) });
    userRepository.findById.mockResolvedValue(user);
    loggedUserService.getLoggedUser.mockReturnValue(makeLoggedUser({ id: 'admin-1' }));

    await expect(
      sut.execute({ ...baseInput, id: 'admin-1', role: 'role-2' }),
    ).rejects.toThrow(BadRequestError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should allow a user to update their own data when the role is left unchanged', async () => {
    const user = makeUser({ id: 'admin-1', role: makeRole({ id: 'role-1' }) });
    userRepository.findById.mockResolvedValue(user);
    loggedUserService.getLoggedUser.mockReturnValue(makeLoggedUser({ id: 'admin-1' }));

    await expect(
      sut.execute({ ...baseInput, id: 'admin-1', role: 'role-1', name: 'Novo Nome' }),
    ).resolves.toBeDefined();
    expect(user.name).toBe('Novo Nome');
  });

  it('should update username/name/email/role on the user entity', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    const newRole = makeRole({ id: 'role-2', name: 'Admin' });
    roleRepository.findById.mockResolvedValue(newRole);

    await sut.execute({ ...baseInput, name: 'Novo Nome' });

    expect(user.username).toBe(baseInput.username);
    expect(user.name).toBe('Novo Nome');
    expect(user.email).toBe(baseInput.email);
    expect(user.role).toBe(newRole);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });

  it('should add newly granted permissions and remove ones no longer selected', async () => {
    const keptPermission = makePermission({ id: 'kept' });
    const removedPermission = makePermission({ id: 'removed' });
    const addedPermission = makePermission({ id: 'added' });

    const user = makeUser({
      userPermissions: [
        makeUserPermission({ id: 'up-kept', permission: keptPermission }),
        makeUserPermission({ id: 'up-removed', permission: removedPermission }),
      ],
    });
    userRepository.findById.mockResolvedValue(user);
    permissionRepository.findPermissionsById.mockResolvedValue([
      keptPermission,
      addedPermission,
    ]);

    await sut.execute(baseInput);

    expect(userPermissionRepository.softDelete).toHaveBeenCalledWith('up-removed');
    expect(userPermissionRepository.softDelete).not.toHaveBeenCalledWith('up-kept');
    expect(userPermissionRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should return the full updated user shape', async () => {
    const user = makeUser();
    userRepository.findById.mockResolvedValue(user);
    const role = makeRole({ id: 'role-1', name: 'Funcionário' });
    roleRepository.findById.mockResolvedValue(role);

    const output = await sut.execute(baseInput);

    expect(output).toMatchObject({
      id: user.id,
      username: baseInput.username,
      name: baseInput.name,
      email: baseInput.email,
      role: { id: 'role-1', name: 'Funcionário' },
    });
  });
});
