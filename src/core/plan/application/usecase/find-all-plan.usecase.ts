import { PROVIDERS } from "@/shared/application/constants/providers";
import { UseCase } from "@/shared/application/usecase/usecase";
import { Inject } from "@nestjs/common";
import { PlanRepository } from "../../domain/repositories/plan.repository";
import { ConflictError } from "@/shared/application/errors/conflict-error";
import { UpdatePlanOutput } from "@/shared/application/output/plan/update-plan.output";
import { PlanOutput } from "@/shared/application/output/plan/plan.output";

type Input = void;

type Output = PlanOutput[]

export class FindAllPlanUseCase implements UseCase<Input, Output> {
  constructor(@Inject(PROVIDERS.PLAN_REPOSITORY) private readonly planRepository: PlanRepository) { }

  async execute(input: Input): Promise<Output> {
    const plans = await this.planRepository.findAll();

    if (!plans) {
      throw new ConflictError(`Plano não encontrado`);
    }

    const output: Output = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      duration: plan.duration,
      userLimit: plan.userLimit,
    }))

    return output;
  }
}