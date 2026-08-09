import { DeletePlanUseCase } from '../usecase/delete.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';

describe('DeletePlanUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById' | 'update'>>;
  let sut: DeletePlanUseCase;

  beforeEach(() => {
    planRepository = {
      findById: jest.fn().mockResolvedValue(makePlan()),
      update: jest.fn().mockResolvedValue(undefined),
    };

    sut = new DeletePlanUseCase(planRepository as unknown as PlanRepository);
  });

  it('should throw ConflictError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ id: 'plan-1' })).rejects.toThrow(ConflictError);
  });

  it('should deactivate and soft-delete the plan', async () => {
    const plan = makePlan();
    planRepository.findById.mockResolvedValue(plan);

    await sut.execute({ id: 'plan-1' });

    expect(plan.active).toBe(false);
    expect(planRepository.update).toHaveBeenCalledWith(plan);
  });
});
