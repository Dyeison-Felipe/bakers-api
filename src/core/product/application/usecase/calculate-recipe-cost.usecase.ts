import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import {
  MaterialUsage,
  ProductRecipeCostCalculator,
} from '../services/product-recipe-cost-calculator.service';
import { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';

type ProductMaterialInput = {
  id: string;
  quantity: number;
};

type AdditionalCostInput = {
  id: string;
  value: number;
};

type RecipeLinkInput = {
  id: string;
};

type Input = {
  productMaterial?: ProductMaterialInput[];
  additionalCosts?: AdditionalCostInput[];
  recipeLinks?: RecipeLinkInput[];
};

type Output = {
  costPrice: number;
};

export class CalculateRecipeCostUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
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

    const materialsUsage = await this.resolveMaterialsUsage(
      input.productMaterial ?? [],
      company.id,
    );

    const materialsCost =
      ProductRecipeCostCalculator.calculateTotalCost(materialsUsage);

    const additionalCostsTotal = await this.resolveAdditionalCostsTotal(
      input.additionalCosts ?? [],
      company.id,
    );

    const recipesCost = await this.resolveRecipeLinksCost(
      input.recipeLinks ?? [],
      company.id,
    );

    const costPrice = materialsCost + additionalCostsTotal + recipesCost;

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

  private async resolveMaterialsUsage(
    productMaterial: ProductMaterialInput[],
    companyId: string,
  ): Promise<MaterialUsage[]> {
    if (!productMaterial?.length) {
      return [];
    }

    const materialIds = productMaterial.map((m) => m.id);

    const materials = await this.productRepository.findAllByIdsAndCompanyId(
      materialIds,
      companyId,
    );

    const materialsMap = new Map(materials.map((m) => [m.id, m]));

    const missing = materialIds.filter((id) => !materialsMap.has(id));
    if (missing.length) {
      throw new NotFoundError(
        `Matéria(s)-prima não encontrada(s): ${missing.join(', ')}`,
      );
    }

    return productMaterial.map((m) => ({
      material: materialsMap.get(m.id)!,
      quantity: m.quantity,
    }));
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