import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { RecipeRepository } from '../../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../../domain/repositories/recipe-item.repository';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Transactional } from 'typeorm-transactional';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

type Input = {
  id: string;
};

type Output = void;

export class DeleteRecipeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const recipe = await this.recipeRepository.findByIdAndCompanyId(
      id,
      loggedUser.company.id,
    );
    if (!recipe) {
      throw new NotFoundError('Receita não encontrada');
    }

    const links = await this.productRecipeLinkRepository.findAllByRecipeId(id);
    if (links.length) {
      throw new ConflictError(
        `Não é possível excluir: receita vinculada a ${links.length} produto(s). Desvincule antes de excluir.`,
      );
    }

    await this.recipeItemRepository.deleteAllByRecipeId(id);
    await this.recipeRepository.delete(id);
  }
}
