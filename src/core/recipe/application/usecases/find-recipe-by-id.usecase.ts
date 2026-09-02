import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ProductRecipeCostCalculator } from '@/core/product/application/services/product-recipe-cost-calculator.service';
import { RecipeDetailOutput } from '@/shared/application/output/recipe/recipe.output';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

type Input = {
  id: string;
};

type Output = RecipeDetailOutput;

export class FindRecipeByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const recipe = await this.recipeRepository.findByIdAndCompanyId(
      id,
      loggedUser.company.id,
    );
    if (!recipe) {
      throw new NotFoundError('Receita não encontrada');
    }

    const items = await this.recipeItemRepository.findAllByRecipeId(id);

    const costPrice = items.length
      ? ProductRecipeCostCalculator.calculateTotalCost(
          items.map((item) => ({
            material: item.material,
            quantity: item.quantity,
          })),
        )
      : 0;

    return {
      id: recipe.id,
      name: recipe.name,
      costPrice,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        material: {
          id: item.material.id,
          name: item.material.name,
          imagePath: item.material.imagePath,
          consumerUnit: item.material.consumerUnit,
          unitCostPrice: item.material.unitCostPrice,
          pricePerKilogram: item.material.pricePerKilogram,
        },
      })),
    };
  }
}
