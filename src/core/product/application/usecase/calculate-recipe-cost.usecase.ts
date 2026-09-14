import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ProductRecipeCostCalculator } from '../services/product-recipe-cost-calculator.service';
import { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';

type AdditionalCostInput = {
  id: string;
  value: number;
};

type RecipeLinkInput = {
  id: string;
};

type Input = {
  additionalCosts?: AdditionalCostInput[];
  recipeLinks?: RecipeLinkInput[];
};

type Output = {
  costPrice: number;
};

export class CalculateRecipeCostUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const additionalCostsTotal = await this.resolveAdditionalCostsTotal(
      input.additionalCosts ?? [],
      company.id,
    );

    const recipesCost = await this.resolveRecipeLinksCost(
      input.recipeLinks ?? [],
      company.id,
    );

    const costPrice = additionalCostsTotal + recipesCost;

    return { costPrice };
  }

  private async resolveRecipeLinksCost(
    recipeLinks: RecipeLinkInput[],
    companyId: string,
  ): Promise<number> {
    if (!recipeLinks.length) return 0;

    const recipeIds = recipeLinks.map((r) => r.id);

    const recipes = await this.recipeRepository.findAllByIdsAndCompanyId(
      recipeIds,
      companyId,
    );
    const foundIds = new Set(recipes.map((r) => r.id));

    const missing = recipeIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundError(`Receita(s) não encontrada(s): ${missing.join(', ')}`);
    }

    const items = await this.recipeItemRepository.findAllByRecipeIds(recipeIds);

    return ProductRecipeCostCalculator.calculateTotalCost(
      items.map((item) => ({ material: item.material, quantity: item.quantity })),
    );
  }

  private async resolveAdditionalCostsTotal(
    additionalCosts: AdditionalCostInput[],
    companyId: string,
  ): Promise<number> {
    if (!additionalCosts.length) {
      return 0;
    }

    const additionalCostIds = additionalCosts.map((ac) => ac.id);

    const foundAdditionalCosts =
      await this.additionalCostRepository.findAllByIdsAndCompanyId(
        additionalCostIds,
        companyId,
      );

    const foundIds = new Set(foundAdditionalCosts.map((ac) => ac.id));

    const missing = additionalCostIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundError(
        `Custo(s) adicional(is) não encontrado(s): ${missing.join(', ')}`,
      );
    }

    return additionalCosts.reduce((total, ac) => total + ac.value, 0);
  }
}
