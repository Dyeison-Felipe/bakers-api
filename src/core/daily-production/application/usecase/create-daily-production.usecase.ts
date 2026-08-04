import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CreateDailyProductionOutput } from '@/shared/application/output/daily-production/create-daily-production.output';
import { Transactional } from 'typeorm-transactional';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProduction } from '../../domain/entities/daily-production.entity';
import { AddDailyProductionItemUseCase } from './add-daily-production-item.usecase';

type ItemInput = {
  productId: string;
  plannedQuantity?: number;
  recipeMultiplier?: number;
};

type Input = {
  productionDate: Date;
  items?: ItemInput[];
};

type Output = CreateDailyProductionOutput;

export class CreateDailyProductionUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly addDailyProductionItemUseCase: AddDailyProductionItemUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const dailyProduction = DailyProduction.create({
      company,
      productionDate: input.productionDate,
      createdBy: loggedUser.id,
    });

    const saved = await this.dailyProductionRepository.save(dailyProduction);

    if (input.items?.length) {
      for (const item of input.items) {
        await this.addDailyProductionItemUseCase.execute({
          dailyProductionId: saved.id,
          productId: item.productId,
          plannedQuantity: item.plannedQuantity,
          recipeMultiplier: item.recipeMultiplier,
        });
      }
    }

    return { id: saved.id };
  }
}
