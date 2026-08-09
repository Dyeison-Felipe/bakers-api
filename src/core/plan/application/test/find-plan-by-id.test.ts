import { FindPlanByIdUseCase } from '../usecase/find-plan-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makePermission, makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';

describe('FindPlanByIdUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let sut: FindPlanByIdUseCase;

  beforeEach(() => {
    planRepository = { findById: jest.fn() };

    sut = new FindPlanByIdUseCase(planRepository as unknown as PlanRepository);
  });

  it('should throw NotFoundError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ id: 'plan-1' })).rejects.toThrow(NotFoundError);
  });

  it('should return an empty permissions array when the plan has none', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ permissions: undefined }));

    const output = await sut.execute({ id: 'plan-1' });

    expect(output.permissions).toEqual([]);
  });

  it('should map plan permissions to the output shape', async () => {
    planRepository.findById.mockResolvedValue(
      makePlan({ permissions: [makePermission({ id: 'permission-1' })] }),
    );

    const output = await sut.execute({ id: 'plan-1' });

    expect(output.permissions).toEqual([
      { id: 'permission-1', action: 'reader', subject: 'product', description: 'Ler produtos' },
    ]);
  });
});
