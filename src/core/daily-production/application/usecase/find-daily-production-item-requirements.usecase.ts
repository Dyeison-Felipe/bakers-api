import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { DailyProductionItemRequirementsOutput } from '@/shared/application/output/daily-production/daily-production-item-requirements.output';
import {
  TypeConsumptionUnit,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
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
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
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

    const recipeLinks = await this.productRecipeLinkRepository.findAllByProductId(
      item.product!.id,
    );

    if (!recipeLinks.length) {
      return { items: [] };
    }

    const recipeItems = await this.recipeItemRepository.findAllByRecipeIds(
      recipeLinks.map((link) => link.recipe.id),
    );

    // Um produto pode ter mais de uma receita vinculada — se a mesma
    // matéria-prima aparecer em receitas diferentes, a produção real consome
    // a soma das quantidades.
    const requirementsByMaterial = new Map<
      string,
      {
        materialId: string;
        materialName: string;
        recipeQuantity: number;
        consumerUnit: TypeConsumptionUnit | null;
      }
    >();

    for (const recipeItem of recipeItems) {
      const materialId = recipeItem.material.id;
      const current = requirementsByMaterial.get(materialId);

      if (current) {
        current.recipeQuantity += recipeItem.quantity;
      } else {
        requirementsByMaterial.set(materialId, {
          materialId,
          materialName: recipeItem.material.name,
          recipeQuantity: recipeItem.quantity,
          consumerUnit: recipeItem.material.consumerUnit,
        });
      }
    }

    return {
      items: Array.from(requirementsByMaterial.values()).map((requirement) => ({
        materialId: requirement.materialId,
        materialName: requirement.materialName,
        recipeQuantity: requirement.recipeQuantity,
        requiredQuantity: round3(requirement.recipeQuantity * multiplier),
        consumerUnit: requirement.consumerUnit,
      })),
    };
  }
}
