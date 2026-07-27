import { PROVIDERS } from "@/shared/application/constants/providers";
import { UseCase } from "@/shared/application/usecase/usecase";
import { Inject } from "@nestjs/common";
import { PlanRepository } from "../../domain/repositories/plan.repository";
import { CreatePlanInput } from "@/shared/application/input/plan/create-plan.input";
import { CreatePlanOutput } from "@/shared/application/output/plan/create-plan.output";
import { ConflictError } from "@/shared/application/errors/conflict-error";
import { Plan } from "../../domain/entities/plan.entity";
import { UpdatePlanOutput } from "@/shared/application/output/plan/update-plan.output";

type Input = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  description: string;
  duration: string;
}

type Output = UpdatePlanOutput

export class UpdatePlanUseCase implements UseCase<Input, Output> {
  constructor(@Inject(PROVIDERS.PLAN_REPOSITORY) private readonly planRepository: PlanRepository) { }

  async execute({ id, active, description, duration, name, price }: Input): Promise<Output> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new ConflictError(`Plano não encontrado`);
    }

    plan.update({
      active: active,
      name: name,
      price: price,
      description: description,
      duration: duration
    })

    await this.planRepository.update(plan);

    const output: Output = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      duration: plan.duration,
    }

    return output;
  }
}