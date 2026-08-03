import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { AdditionalCostRepository } from '../../domain/repositories/additional-cost.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { AdditionalCostOutput } from '@/shared/application/output/additional-cost/additional-colst.output';

type Input = void

type Output = AdditionalCostOutput[];

export class FindAllAdditionalCostsByCompanyUseCase implements UseCase<
  Input,
  Output
> {
  constructor(
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggesUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggesUserService.getLoggedUser();

    const company = loggedUser.company;

    const items = await this.additionalCostRepository.findAllByCompanyId(
      company.id,
    );

    const output: Output = items.map((item) => ({
      id: item.id,
      name: item.name,
    }));

    return output;
  }
}
