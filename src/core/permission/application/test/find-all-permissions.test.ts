import { FindAllPermissionsUseCase } from '../usecase/find-all-permissions';
import { Permission } from '../../domain/entity/permission.entity';
import type { PermissionRepository } from '../../domain/repositories/permission.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const makePermission = (overrides: Record<string, unknown> = {}): Permission => {
  const permission = {
    id: 'permission-1',
    action: 'reader',
    subject: 'product',
    description: 'Ler produtos',
    ...overrides,
  };
  Object.setPrototypeOf(permission, Permission.prototype);
  return permission as unknown as Permission;
};

describe('FindAllPermissionsUseCase', () => {
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findAll'>>;
  let loggedUserService: jest.Mocked<Pick<LoggedUserService, 'getLoggedUser'>>;
  let sut: FindAllPermissionsUseCase;

  const loginAs = (roleName: string) =>
    loggedUserService.getLoggedUser.mockReturnValue({
      role: { name: roleName },
    } as never);

  beforeEach(() => {
    permissionRepository = { findAll: jest.fn() };
    loggedUserService = { getLoggedUser: jest.fn() };
    loginAs('Admin');

    sut = new FindAllPermissionsUseCase(
      permissionRepository as unknown as PermissionRepository,
      loggedUserService as unknown as LoggedUserService,
    );
  });

  it('should return an empty array when the repository returns null', async () => {
    permissionRepository.findAll.mockResolvedValue(null);

    const output = await sut.execute();

    expect(output).toEqual([]);
  });

  it('should map each permission to the output shape', async () => {
    permissionRepository.findAll.mockResolvedValue([makePermission()]);

    const output = await sut.execute();

    expect(output).toEqual([
      { id: 'permission-1', action: 'reader', subject: 'product', description: 'Ler produtos' },
    ]);
  });

  it('should hide platform-only permissions (plan) from company users', async () => {
    permissionRepository.findAll.mockResolvedValue([
      makePermission(),
      makePermission({ id: 'permission-plan', subject: 'plan', description: 'Ler planos' }),
    ]);

    const output = await sut.execute();

    expect(output.map((p) => p.id)).toEqual(['permission-1']);
  });

  it('should return platform-only permissions to the Super Admin', async () => {
    loginAs('Super Admin');
    permissionRepository.findAll.mockResolvedValue([
      makePermission(),
      makePermission({ id: 'permission-plan', subject: 'plan', description: 'Ler planos' }),
    ]);

    const output = await sut.execute();

    expect(output.map((p) => p.id)).toEqual(['permission-1', 'permission-plan']);
  });
});
