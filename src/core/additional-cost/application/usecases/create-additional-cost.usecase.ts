import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { AdditionalCostRepository } from '../../domain/repositories/additional-cost.repository';
import { AdditionalCost } from '../../domain/entities/additional-cost.entity';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { AdditionalCostOutput } from '@/shared/application/output/additional-cost/additional-colst.output';

type Input = {
  name: string;
};

type Output = AdditionalCostOutput;

export class CreateAdditionalCostUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggesUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggesUserService.getLoggedUser();

    const company = loggedUser.company

    const additionalCost = AdditionalCost.create({
      name: input.name,
      company,
      createdBy: loggedUser.id,
      updatedBy: loggedUser.id,
    });

    await this.additionalCostRepository.save(additionalCost);

    return {
      id: additionalCost.id,
    };
  }
}