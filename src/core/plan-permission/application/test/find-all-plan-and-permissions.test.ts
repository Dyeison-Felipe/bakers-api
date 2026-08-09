import { FindAllPlanAndPermissionsUseCase } from '../usecase/find-all-plan-and-permissions.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { PlanPermission } from '../../domain/entity/plan-permission.entity';
import type { PlanPermissionRepository } from '../../domain/repositories/plan-permission.repository';

const makePlanPermission = (overrides: Record<string, unknown> = {}): PlanPermission => {
  const planPermission = {
    id: 'plan-permission-1',
    plan: {
      id: 'plan-1',
      name: 'Plano Básico',
      description: 'Plano básico',
      price: 100,
      active: true,
      duration: 'MONTHLY',
    },
    permission: { description: 'Ler produtos' },
    ...overrides,
  };
  Object.setPrototypeOf(planPermission, PlanPermission.prototype);
  return planPermission as unknown as PlanPermission;
};

describe('FindAllPlanAndPermissionsUseCase', () => {
  let planPermissionRepository: jest.Mocked<
    Pick<PlanPermissionRepository, 'findAllPlansAndPermissions'>
  >;
  let sut: FindAllPlanAndPermissionsUseCase;

  beforeEach(() => {
    planPermissionRepository = { findAllPlansAndPermissions: jest.fn() };

    sut = new FindAllPlanAndPermissionsUseCase(
      planPermissionRepository as unknown as PlanPermissionRepository,
    );
  });

  it('should throw NotFoundError when there are no plan permissions', async () => {
    planPermissionRepository.findAllPlansAndPermissions.mockResolvedValue([]);

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
  });

  it('should group permissions by plan id', async () => {
    planPermissionRepository.findAllPlansAndPermissions.mockResolvedValue([
      makePlanPermission({ id: 'pp-1', permission: { description: 'Ler produtos' } }),
      makePlanPermission({ id: 'pp-2', permission: { description: 'Criar produtos' } }),
    ]);

    const output = await sut.execute();

    expect(output).toHaveLength(1);
    expect(output[0].plan.id).toBe('plan-1');
    expect(output[0].permissions).toEqual([
      { description: 'Ler produtos' },
      { description: 'Criar produtos' },
    ]);
  });

  it('should create a separate group for each distinct plan', async () => {
    planPermissionRepository.findAllPlansAndPermissions.mockResolvedValue([
      makePlanPermission({
        id: 'pp-1',
        plan: { id: 'plan-1', name: 'Básico', description: '', price: 10, active: true, duration: 'MONTHLY' },
      }),
      makePlanPermission({
        id: 'pp-2',
        plan: { id: 'plan-2', name: 'Premium', description: '', price: 20, active: true, duration: 'MONTHLY' },
      }),
    ]);

    const output = await sut.execute();

    expect(output).toHaveLength(2);
    expect(output.map((o) => o.plan.id)).toEqual(['plan-1', 'plan-2']);
  });
});
