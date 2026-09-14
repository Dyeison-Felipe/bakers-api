import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductRecipeCostCalculator } from '@/core/product/application/services/product-recipe-cost-calculator.service';
import { RecipeDetailOutput } from '@/shared/application/output/recipe/recipe.output';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';

type Input = {
  name?: string;
  page?: number;
  limit?: number;
};

type Output = PaginationOutput<Omit<RecipeDetailOutput, 'items'>>;

export class FindAllRecipesByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input = {}): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const { items: recipes, meta } =
      await this.recipeRepository.findAllByCompanyIdPaginated(
        company.id,
        { page: input.page, limit: input.limit },
        input.name,
      );

    if (!recipes.length) {
      return { items: [], meta };
    }

    const recipeItems = await this.recipeItemRepository.findAllByRecipeIds(
      recipes.map((recipe) => recipe.id),
    );

    const itemsByRecipeId = new Map<string, typeof recipeItems>();
    for (const item of recipeItems) {
      const list = itemsByRecipeId.get(item.recipe.id) ?? [];
      list.push(item);
      itemsByRecipeId.set(item.recipe.id, list);
    }

    const items = recipes.map((recipe) => {
      const items = itemsByRecipeId.get(recipe.id) ?? [];
      const costPrice = items.length
        ? ProductRecipeCostCalculator.calculateTotalCost(
            items.map((item) => ({
              material: item.material,
              quantity: item.quantity,
            })),
          )
        : 0;

      return { id: recipe.id, name: recipe.name, costPrice };
    });

    return { items, meta };
  }
}
