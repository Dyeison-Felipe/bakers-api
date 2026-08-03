// core/additional-cost/application/usecases/find-additional-cost-by-id.usecase.ts
import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { AdditionalCostRepository } from '../../domain/repositories/additional-cost.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { AdditionalCostOutput } from '@/shared/application/output/additional-cost/additional-colst.output';

type Input = {
  id: string;
};

type Output = AdditionalCostOutput;

export class FindAdditionalCostByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const additionalCost = await this.additionalCostRepository.findById(id);
    if (!additionalCost) {
      throw new NotFoundError('Additional cost not found');
    }

    return {
      id: additionalCost.id,
      name: additionalCost.name,
    };
  }
}
