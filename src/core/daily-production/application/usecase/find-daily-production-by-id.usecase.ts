import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { DailyProductionOutput } from '@/shared/application/output/daily-production/daily-production.output';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  id: string;
};

type Output = DailyProductionOutput;

export class FindDailyProductionByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const dailyProduction = await this.dailyProductionRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!dailyProduction) {
      throw new NotFoundError('Produção diária não encontrada');
    }

    const items = await this.dailyProductionItemRepository.findAllByDailyProductionId(
      dailyProduction.id,
    );

    return {
      id: dailyProduction.id,
      productionDate: dailyProduction.productionDate,
      status: dailyProduction.status,
      totalPlannedCost: items.reduce((sum, item) => sum + item.plannedCost, 0),
      items: items.map((item) => ({
        id: item.id,
        product: {
          id: item.product!.id,
          name: item.product!.name,
        },
        unitOfMeasurement: item.unitOfMeasurement,
        plannedQuantity: item.plannedQuantity,
        recipeMultiplier: item.recipeMultiplier,
        plannedWeight: item.plannedWeight,
        plannedCost: item.plannedCost,
        status: item.status,
        actualQuantity: item.actualQuantity,
        actualWeight: item.actualWeight,
        producedAt: item.producedAt,
      })),
    };
  }
}
