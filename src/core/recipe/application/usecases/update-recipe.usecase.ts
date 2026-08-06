import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { RecipeItem } from '../../domain/entities/recipe-item.entity';
import { Recipe } from '../../domain/entities/recipe.entity';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { TypeProduct } from '@/shared/infra/enums/product';
import { Transactional } from 'typeorm-transactional';
import { RecipeOutput } from '@/shared/application/output/recipe/recipe.output';

type RecipeItemInput = {
  id: string;
  quantity: number;
};

type Input = {
  id: string;
  name: string;
  items: RecipeItemInput[];
};

type Output = RecipeOutput;

export class UpdateRecipeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const recipe = await this.recipeRepository.findByIdAndCompanyId(
      input.id,
      company.id,
    );
    if (!recipe) {
      throw new NotFoundError('Receita não encontrada');
    }

    const existingRecipes = await this.recipeRepository.findAllByCompanyId(
      company.id,
    );
    if (
      existingRecipes.some(
        (existing) => existing.id !== recipe.id && existing.name === input.name,
      )
    ) {
      throw new ConflictError(`Receita ${input.name} já está cadastrada`);
    }

    recipe.updateName(input.name, loggedUser.id);
    await this.recipeRepository.update(recipe);

    await this.syncItems(recipe, input.items, company.id);

    return { id: recipe.id, name: recipe.name };
  }

  private async syncItems(
    recipe: Recipe,
    items: RecipeItemInput[],
    companyId: string,
  ): Promise<void> {
    const materialIds = items.map((item) => item.id);

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

    const notRawMaterial = materials.filter(
      (m) => m.typeProduct !== TypeProduct.RAW_MATERIAL,
    );
    if (notRawMaterial.length) {
      throw new BadRequestError(
        `Só é possível usar matéria-prima em receitas: ${notRawMaterial
          .map((m) => m.name)
          .join(', ')}`,
      );
    }

    const existingItems = await this.recipeItemRepository.findAllByRecipeId(
      recipe.id,
    );
    const existingByMaterialId = new Map(
      existingItems.map((item) => [item.material.id, item]),
    );
    const incomingByMaterialId = new Map(items.map((item) => [item.id, item]));

    const toRemove = existingItems.filter(
      (item) => !incomingByMaterialId.has(item.material.id),
    );
    await Promise.all(
      toRemove.map((item) => this.recipeItemRepository.deleteById(item.id)),
    );

    for (const incoming of items) {
      const material = materialsMap.get(incoming.id)!;
      const existing = existingByMaterialId.get(incoming.id);

      if (existing) {
        if (existing.quantity !== incoming.quantity) {
          existing.updateQuantity(incoming.quantity);
          await this.recipeItemRepository.save(existing);
        }
      } else {
        await this.recipeItemRepository.save(
          RecipeItem.create({ recipe, material, quantity: incoming.quantity }),
        );
      }
    }
  }
}
