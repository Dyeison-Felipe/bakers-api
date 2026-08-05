import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { UpdateDailyProductionItemOutput } from '@/shared/application/output/daily-production/update-daily-production-item.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { DailyProductionItemCostCalculator } from '../services/daily-production-item-cost-calculator.service';

type Input = {
  id: string;
  plannedQuantity?: number;
  recipeMultiplier?: number;
};

type Output = UpdateDailyProductionItemOutput;

export class UpdateDailyProductionItemUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const item = await this.dailyProductionItemRepository.findByIdWithDailyProduction(
      input.id,
    );

    if (!item || item.dailyProduction?.company?.id !== loggedUser.company.id) {
      throw new NotFoundError('Item de produção não encontrado');
    }

    if (item.status !== TypeDailyProductionItemStatus.PLANNED) {
      throw new BadRequestError(
        'Apenas itens aguardando produção podem ser editados',
      );
    }

    if (item.dailyProduction!.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    const isWeightBased = item.unitOfMeasurement === TypeUnitOfMeasurement.KG;

    const { plannedWeight, plannedCost } = DailyProductionItemCostCalculator.calculate({
      unitOfMeasurement: item.unitOfMeasurement,
      plannedQuantity: isWeightBased ? null : (input.plannedQuantity ?? null),
      recipeMultiplier: isWeightBased ? (input.recipeMultiplier ?? null) : null,
      productWeight: item.product!.weight,
      unitCostPrice: item.unitCostPriceSnapshot ?? 0,
      pricePerKilogram: item.pricePerKilogramSnapshot,
    });

    item.updatePlanned({
      plannedQuantity: isWeightBased ? null : (input.plannedQuantity ?? null),
      recipeMultiplier: isWeightBased ? (input.recipeMultiplier ?? null) : null,
      plannedWeight,
      plannedCost,
      updatedBy: loggedUser.id,
    });

    await this.dailyProductionItemRepository.update(item);

    return { id: item.id };
  }
}
