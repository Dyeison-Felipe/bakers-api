import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';

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

type Output = {
  recipeItems: RecipeItemOutput[];
  additionalCost: AdditionalCostItemOutput[];
};

export class FindProductRecipeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_RECIPE_ITEM)
    private readonly productRecipeItemRepository: ProductRecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY)
    private readonly productAdditionalCostRepository: ProductAdditionalCostRepository,
  ) {}

  async execute({ productId }: Input): Promise<Output> {
    const [recipeItems, additionalCosts] = await Promise.all([
      this.productRecipeItemRepository.findAllByProductId(productId),
      this.productAdditionalCostRepository.findAllByProductId(productId),
    ]);

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
    };

    return output;
  }
}
