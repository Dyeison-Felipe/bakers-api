import { CreatePlanUseCase } from '../usecase/create-plan.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makePermission, makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';
import type { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import type { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';

describe('CreatePlanUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findByName' | 'save'>>;
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findPermissionsById'>>;
  let planPermissionRepository: jest.Mocked<Pick<PlanPermissionRepository, 'saveMany'>>;
  let sut: CreatePlanUseCase;

  const input = {
    name: 'Plano Básico',
    price: 100,
    description: 'Plano básico',
    duration: 30,
    userLimit: null,
    permissionIds: ['permission-1'],
  };

  beforeEach(() => {
    planRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    permissionRepository = {
      findPermissionsById: jest.fn().mockResolvedValue([makePermission({ id: 'permission-1' })]),
    };
    planPermissionRepository = {
      saveMany: jest.fn().mockImplementation(async (items) => items),
    };

    sut = new CreatePlanUseCase(
      planRepository as unknown as PlanRepository,
      permissionRepository as unknown as PermissionRepository,
      planPermissionRepository as unknown as PlanPermissionRepository,
    );
  });

  it('should throw ConflictError when a plan with the same name already exists', async () => {
    planRepository.findByName.mockResolvedValue(makePlan());

    await expect(sut.execute(input)).rejects.toThrow(ConflictError);
  });

  it('should throw NotFoundError when some permission ids do not exist', async () => {
    permissionRepository.findPermissionsById.mockResolvedValue([]);

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should create the plan and persist its permissions', async () => {
    await sut.execute(input);

    expect(planRepository.save).toHaveBeenCalledTimes(1);
    expect(planPermissionRepository.saveMany).toHaveBeenCalledTimes(1);
    expect(planPermissionRepository.saveMany.mock.calls[0][0]).toHaveLength(1);
  });

  it('should return the created plan with its permissions', async () => {
    const output = await sut.execute(input);

    expect(output).toEqual({
      id: expect.any(String),
      name: 'Plano Básico',
      price: 100,
      active: true,
      description: 'Plano básico',
      duration: 30,
      userLimit: null,
      permissions: [
        { id: 'permission-1', action: 'reader', subject: 'product', description: 'Ler produtos' },
      ],
    });
  });
});
