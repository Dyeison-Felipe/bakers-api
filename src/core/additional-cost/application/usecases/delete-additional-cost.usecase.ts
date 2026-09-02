import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { AdditionalCostRepository } from '../../domain/repositories/additional-cost.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

type Input = {
  id: string;
};

type Output = void;

export class DeleteAdditionalCostUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const additionalCost = await this.additionalCostRepository.findByIdAndCompanyId(
      id,
      loggedUser.company.id,
    );
    if (!additionalCost) {
      throw new NotFoundError('Additional cost not found');
    }

    await this.additionalCostRepository.delete(id);
  }
}