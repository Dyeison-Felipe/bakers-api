import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { AddDailyProductionItemsOutput } from '@/shared/application/output/daily-production/add-daily-production-items.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { Transactional } from 'typeorm-transactional';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { DailyProductionItemCostCalculator } from '../services/daily-production-item-cost-calculator.service';
import { AddDailyProductionItemUseCase } from './add-daily-production-item.usecase';

type ItemInput = {
  productId: string;
  plannedQuantity?: number;
  recipeMultiplier?: number;
};

type Input = {
  dailyProductionId: string;
  items: ItemInput[];
};

type Output = AddDailyProductionItemsOutput;

/**
 * Versão em lote do `AddDailyProductionItemUseCase`: recebe vários produtos de
 * uma vez (usado pelo modal de "adicionar itens à produção", que virou uma
 * lista em vez de um select de um produto por vez). Para produtos que já têm
 * um item PLANNED nessa produção diária, soma a quantidade/multiplicador em
 * vez de criar uma linha duplicada.
 */
export class AddDailyProductionItemsUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly addDailyProductionItemUseCase: AddDailyProductionItemUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    if (!input.items.length) {
      throw new BadRequestError('Informe ao menos um item');
    }

    const dailyProduction =
      await this.dailyProductionRepository.findByIdAndCompanyId(
        input.dailyProductionId,
        company.id,
      );

    if (!dailyProduction) {
      throw new NotFoundError('Produção diária não encontrada');
    }

    if (dailyProduction.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    const existingItems =
      await this.dailyProductionItemRepository.findAllByDailyProductionId(
        dailyProduction.id,
      );

    const existingPlannedByProductId = new Map(
      existingItems
        .filter((item) => item.status === TypeDailyProductionItemStatus.PLANNED)
        .map((item) => [item.product!.id, item]),
    );

    const itemIds: string[] = [];

    for (const incoming of input.items) {
      const existing = existingPlannedByProductId.get(incoming.productId);

      if (existing) {
        const isWeightBased =
          existing.unitOfMeasurement === TypeUnitOfMeasurement.KG;

        const summedPlannedQuantity = isWeightBased
          ? null
          : (existing.plannedQuantity ?? 0) + (incoming.plannedQuantity ?? 0);
        const summedRecipeMultiplier = isWeightBased
          ? (existing.recipeMultiplier ?? 0) + (incoming.recipeMultiplier ?? 0)
          : null;

        const { plannedWeight, plannedCost } =
          DailyProductionItemCostCalculator.calculate({
            unitOfMeasurement: existing.unitOfMeasurement,
            plannedQuantity: summedPlannedQuantity,
            recipeMultiplier: summedRecipeMultiplier,
            productWeight: existing.product!.weight,
            unitCostPrice: existing.unitCostPriceSnapshot ?? 0,
            pricePerKilogram: existing.pricePerKilogramSnapshot,
          });

        existing.updatePlanned({
          plannedQuantity: summedPlannedQuantity,
          recipeMultiplier: summedRecipeMultiplier,
          plannedWeight,
          plannedCost,
          updatedBy: loggedUser.id,
        });

        await this.dailyProductionItemRepository.update(existing);
        itemIds.push(existing.id);
      } else {
        const { id } = await this.addDailyProductionItemUseCase.execute({
          dailyProductionId: dailyProduction.id,
          productId: incoming.productId,
          plannedQuantity: incoming.plannedQuantity,
          recipeMultiplier: incoming.recipeMultiplier,
        });

        itemIds.push(id);
      }
    }

    return { itemIds };
  }
}
