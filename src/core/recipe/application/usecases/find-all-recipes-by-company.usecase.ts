import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductRecipeCostCalculator } from '@/core/product/application/services/product-recipe-cost-calculator.service';
import { RecipeDetailOutput } from '@/shared/application/output/recipe/recipe.output';

type Input = void;

type Output = Omit<RecipeDetailOutput, 'items'>[];

export class FindAllRecipesByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const recipes = await this.recipeRepository.findAllByCompanyId(company.id);
    if (!recipes.length) return [];

    const items = await this.recipeItemRepository.findAllByRecipeIds(
      recipes.map((recipe) => recipe.id),
    );

    const itemsByRecipeId = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsByRecipeId.get(item.recipe.id) ?? [];
      list.push(item);
      itemsByRecipeId.set(item.recipe.id, list);
    }

    return recipes.map((recipe) => {
      const recipeItems = itemsByRecipeId.get(recipe.id) ?? [];
      const costPrice = recipeItems.length
        ? ProductRecipeCostCalculator.calculateTotalCost(
            recipeItems.map((item) => ({
              material: item.material,
              quantity: item.quantity,
            })),
          )
        : 0;

      return { id: recipe.id, name: recipe.name, costPrice };
    });
  }
}
