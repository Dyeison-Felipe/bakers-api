import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { Recipe } from '../../domain/entities/recipe.entity';
import { RecipeItem } from '../../domain/entities/recipe-item.entity';
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
  name: string;
  items: RecipeItemInput[];
};

type Output = RecipeOutput;

export class CreateRecipeUseCase implements UseCase<Input, Output> {
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

    const existingRecipe = await this.recipeRepository.findAllByCompanyId(
      company.id,
    );
    if (existingRecipe.some((recipe) => recipe.name === input.name)) {
      throw new ConflictError(`Receita ${input.name} já está cadastrada`);
    }

    const materials = await this.resolveMaterials(input.items, company.id);

    const recipe = Recipe.create({
      name: input.name,
      company,
      createdBy: loggedUser.id,
      updatedBy: loggedUser.id,
    });

    const savedRecipe = await this.recipeRepository.save(recipe);

    await Promise.all(
      input.items.map((item) =>
        this.recipeItemRepository.save(
          RecipeItem.create({
            recipe: savedRecipe,
            material: materials.get(item.id)!,
            quantity: item.quantity,
          }),
        ),
      ),
    );

    return { id: savedRecipe.id, name: savedRecipe.name };
  }

  private async resolveMaterials(items: RecipeItemInput[], companyId: string) {
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

    return materialsMap;
  }
}
