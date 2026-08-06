import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { ProductRecipeCostCalculator } from '../services/product-recipe-cost-calculator.service';

type Input = {
  productId: string;
};

type RecipeItemOutput = {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    imagePath: string | null;
    consumerUnit: string | null;
    unitCostPrice: number;
    pricePerKilogram: number | null;
    costPrice: number;
  };
};

type AdditionalCostItemOutput = {
  id: string;
  value: number;
  additionalCost: {
    id: string;
    name: string;
  };
};

type RecipeLinkOutput = {
  id: string;
  recipe: {
    id: string;
    name: string;
    costPrice: number;
  };
};

type Output = {
  recipeItems: RecipeItemOutput[];
  additionalCost: AdditionalCostItemOutput[];
  recipeLinks: RecipeLinkOutput[];
};

export class FindProductRecipeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_RECIPE_ITEM)
    private readonly productRecipeItemRepository: ProductRecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY)
    private readonly productAdditionalCostRepository: ProductAdditionalCostRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
  ) {}

  async execute({ productId }: Input): Promise<Output> {
    const [recipeItems, additionalCosts, recipeLinks] = await Promise.all([
      this.productRecipeItemRepository.findAllByProductId(productId),
      this.productAdditionalCostRepository.findAllByProductId(productId),
      this.productRecipeLinkRepository.findAllByProductId(productId),
    ]);

    const recipeLinksOutput = await Promise.all(
      recipeLinks.map(async (link) => {
        const items = await this.recipeItemRepository.findAllByRecipeId(
          link.recipe.id,
        );
        const costPrice = items.length
          ? ProductRecipeCostCalculator.calculateTotalCost(
              items.map((item) => ({
                material: item.material,
                quantity: item.quantity,
              })),
            )
          : 0;

        return {
          id: link.id,
          recipe: { id: link.recipe.id, name: link.recipe.name, costPrice },
        };
      }),
    );

    const output: Output = {
      recipeItems: recipeItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        material: {
          id: item.material.id,
          name: item.material.name,
          imagePath: item.material.imagePath,
          consumerUnit: item.material.consumerUnit,
          unitCostPrice: item.material.unitCostPrice,
          pricePerKilogram: item.material.pricePerKilogram,
          costPrice: item.material.costPrice,
        },
      })),
      additionalCost: additionalCosts.map((item) => ({
        id: item.id,
        value: item.value,
        additionalCost: {
          id: item.additionalCost.id,
          name: item.additionalCost.name,
        },
      })),
      recipeLinks: recipeLinksOutput,
    };

    return output;
  }
}
