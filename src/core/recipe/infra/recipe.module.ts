import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { RecipePersistenceModule } from './recipe-persistence.module';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { RecipeController } from './controller/recipe.controller';
import { CreateRecipeUseCase } from '../application/usecases/create-recipe.usecase';
import { UpdateRecipeUseCase } from '../application/usecases/update-recipe.usecase';
import { DeleteRecipeUseCase } from '../application/usecases/delete-recipe.usecase';
import { FindRecipeByIdUseCase } from '../application/usecases/find-recipe-by-id.usecase';
import { FindAllRecipesByCompanyUseCase } from '../application/usecases/find-all-recipes-by-company.usecase';
import { RecipeRepository } from '../domain/repositories/recipe.repository';
import { RecipeItemRepository } from '../domain/repositories/recipe-item.repository';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

@Module({
  imports: [RecipePersistenceModule, ProductPersistenceModule],
  controllers: [RecipeController],
  providers: [
    {
      provide: CreateRecipeUseCase,
      useFactory: (
        recipeRepository: RecipeRepository,
        recipeItemRepository: RecipeItemRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new CreateRecipeUseCase(
          recipeRepository,
          recipeItemRepository,
          productRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.RECIPE_REPOSITORY,
        PROVIDERS.RECIPE_ITEM_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: UpdateRecipeUseCase,
      useFactory: (
        recipeRepository: RecipeRepository,
        recipeItemRepository: RecipeItemRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new UpdateRecipeUseCase(
          recipeRepository,
          recipeItemRepository,
          productRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.RECIPE_REPOSITORY,
        PROVIDERS.RECIPE_ITEM_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: DeleteRecipeUseCase,
      useFactory: (
        recipeRepository: RecipeRepository,
        recipeItemRepository: RecipeItemRepository,
        productRecipeLinkRepository: ProductRecipeLinkRepository,
      ) => {
        return new DeleteRecipeUseCase(
          recipeRepository,
          recipeItemRepository,
          productRecipeLinkRepository,
        );
      },
      inject: [
        PROVIDERS.RECIPE_REPOSITORY,
        PROVIDERS.RECIPE_ITEM_REPOSITORY,
        PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY,
      ],
    },
    {
      provide: FindRecipeByIdUseCase,
      useFactory: (
        recipeRepository: RecipeRepository,
        recipeItemRepository: RecipeItemRepository,
      ) => {
        return new FindRecipeByIdUseCase(recipeRepository, recipeItemRepository);
      },
      inject: [PROVIDERS.RECIPE_REPOSITORY, PROVIDERS.RECIPE_ITEM_REPOSITORY],
    },
    {
      provide: FindAllRecipesByCompanyUseCase,
      useFactory: (
        recipeRepository: RecipeRepository,
        recipeItemRepository: RecipeItemRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllRecipesByCompanyUseCase(
          recipeRepository,
          recipeItemRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.RECIPE_REPOSITORY,
        PROVIDERS.RECIPE_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  // Reexporta o módulo inteiro (não os tokens soltos) — o Nest só permite
  // exportar um token que o próprio módulo declarou em `providers`, ou
  // reexportar o módulo importado que o declara.
  exports: [RecipePersistenceModule],
})
export class RecipeModule {}
