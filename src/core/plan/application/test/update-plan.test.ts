import { UpdatePlanUseCase } from '../usecase/update-plan.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makePermission, makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';
import type { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import type { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';

describe('UpdatePlanUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById' | 'update'>>;
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findPermissionsById'>>;
  let planPermissionRepository: jest.Mocked<
    Pick<PlanPermissionRepository, 'deleteAllByPlanId' | 'saveMany'>
  >;
  let sut: UpdatePlanUseCase;

  const input = {
    id: 'plan-1',
    name: 'Plano Atualizado',
    price: 200,
    active: true,
    description: 'Descrição nova',
    duration: 365,
    permissionIds: ['permission-1'],
  };

  beforeEach(() => {
    planRepository = {
      findById: jest.fn().mockResolvedValue(makePlan()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    permissionRepository = {
      findPermissionsById: jest.fn().mockResolvedValue([makePermission({ id: 'permission-1' })]),
    };
    planPermissionRepository = {
      deleteAllByPlanId: jest.fn().mockResolvedValue(undefined),
      saveMany: jest.fn().mockImplementation(async (items) => items),
    };

    sut = new UpdatePlanUseCase(
      planRepository as unknown as PlanRepository,
      permissionRepository as unknown as PermissionRepository,
      planPermissionRepository as unknown as PlanPermissionRepository,
    );
  });

  it('should throw NotFoundError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when some permission ids do not exist', async () => {
    permissionRepository.findPermissionsById.mockResolvedValue([]);

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should replace all plan permissions (delete then re-save)', async () => {
    await sut.execute(input);

    expect(planPermissionRepository.deleteAllByPlanId).toHaveBeenCalledWith('plan-1');
    expect(planPermissionRepository.saveMany).toHaveBeenCalledTimes(1);
  });

  it('should update the plan fields and return the updated output', async () => {
    const plan = makePlan();
    planRepository.findById.mockResolvedValue(plan);

    const output = await sut.execute(input);

    expect(plan.name).toBe('Plano Atualizado');
    expect(plan.price).toBe(200);
    expect(plan.duration).toBe(365);
    expect(output.permissions).toEqual([
      { id: 'permission-1', action: 'reader', subject: 'product', description: 'Ler produtos' },
    ]);
  });
});
