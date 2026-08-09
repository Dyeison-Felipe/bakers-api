import { FindAllPermissionsUseCase } from '../usecase/find-all-permissions';
import { Permission } from '../../domain/entity/permission.entity';
import type { PermissionRepository } from '../../domain/repositories/permission.repository';

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
  let sut: FindAllPermissionsUseCase;

  beforeEach(() => {
    permissionRepository = { findAll: jest.fn() };

    sut = new FindAllPermissionsUseCase(permissionRepository as unknown as PermissionRepository);
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
});
