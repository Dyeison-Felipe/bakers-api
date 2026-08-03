import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { AdditionalCostRepository } from '../../domain/repositories/additional-cost.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { AdditionalCostOutput } from '@/shared/application/output/additional-cost/additional-colst.output';

type Input = {
  id: string;
  name: string;
};

type Output = AdditionalCostOutput;

export class UpdateAdditionalCostUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggesUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggesUserService.getLoggedUser();
    const additionalCost = await this.additionalCostRepository.findById(
      input.id,
    );
    if (!additionalCost) {
      throw new NotFoundError('Additional cost not found');
    }

    additionalCost.updateName(input.name, loggedUser.id);

    await this.additionalCostRepository.update(additionalCost);

    return {
      id: additionalCost.id,
    };
  }
}
