import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { DailyProductionItemRequirementsOutput } from '@/shared/application/output/daily-production/daily-production-item-requirements.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { ProductRecipeItemRepository } from '@/core/product/domain/repositories/product-recipe-item.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  itemId: string;
};

type Output = DailyProductionItemRequirementsOutput;

const round3 = (value: number) => Math.round(value * 1000) / 1000;

export class FindDailyProductionItemRequirementsUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_ITEM)
    private readonly productRecipeItemRepository: ProductRecipeItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ itemId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const item = await this.dailyProductionItemRepository.findByIdWithDailyProduction(
      itemId,
    );

    if (!item || item.dailyProduction?.company?.id !== loggedUser.company.id) {
      throw new NotFoundError('Item de produção não encontrado');
    }

    const isWeightBased = item.unitOfMeasurement === TypeUnitOfMeasurement.KG;
    const productQuantity = item.product!.quantity;

    const multiplier = isWeightBased
      ? (item.recipeMultiplier ?? 0)
      : productQuantity
        ? (item.plannedQuantity ?? 0) / productQuantity
        : 0;

    const recipeItems = await this.productRecipeItemRepository.findAllByProductId(
      item.product!.id,
    );

    return {
      items: recipeItems.map((recipeItem) => ({
        materialId: recipeItem.material.id,
        materialName: recipeItem.material.name,
        recipeQuantity: recipeItem.quantity,
        requiredQuantity: round3(recipeItem.quantity * multiplier),
        consumerUnit: recipeItem.material.consumerUnit,
      })),
    };
  }
}
