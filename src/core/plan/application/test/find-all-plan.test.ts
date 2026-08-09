import { FindAllPlanUseCase } from '../usecase/find-all-plan.usecase';
import { makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';

describe('FindAllPlanUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findAll'>>;
  let sut: FindAllPlanUseCase;

  beforeEach(() => {
    planRepository = { findAll: jest.fn().mockResolvedValue([]) };

    sut = new FindAllPlanUseCase(planRepository as unknown as PlanRepository);
  });

  it('should return an empty array when there are no plans', async () => {
    const output = await sut.execute();

    expect(output).toEqual([]);
  });

  it('should map each plan to the output shape', async () => {
    planRepository.findAll.mockResolvedValue([makePlan()]);

    const output = await sut.execute();

    expect(output).toEqual([
      {
        id: 'plan-1',
        name: 'Plano Básico',
        price: 100,
        active: true,
        description: 'Plano básico',
        duration: 'MONTHLY',
      },
    ]);
  });
});
