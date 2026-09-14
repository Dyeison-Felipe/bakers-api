import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { ProductRecipeCostCalculator } from '../services/product-recipe-cost-calculator.service';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';

type Input = {
  productId: string;
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
  additionalCost: AdditionalCostItemOutput[];
  recipeLinks: RecipeLinkOutput[];
};

export class FindProductRecipeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY)
    private readonly productAdditionalCostRepository: ProductAdditionalCostRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ productId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const product = await this.productRepository.findProductByIdAndCompanyId(
      productId,
      loggedUser.company.id,
    );

    if (!product) {
      throw new NotFoundError('Produto não encontrado');
    }

    const [additionalCosts, recipeLinks] = await Promise.all([
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
