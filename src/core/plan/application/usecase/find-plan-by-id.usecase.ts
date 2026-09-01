import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { FindPlanByIdOutput } from '@/shared/application/output/plan/find-plan-by-id.output';

type Input = {
  id: string;
};

type Output = FindPlanByIdOutput;

export class FindPlanByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new NotFoundError(`Plano não encontrado`);
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      duration: plan.duration,
      userLimit: plan.userLimit,
      permissions: (plan.permissions ?? []).map((permission) => ({
        id: permission.id,
        action: permission.action,
        subject: permission.subject,
        description: permission.description,
      })),
    };
  }
}
