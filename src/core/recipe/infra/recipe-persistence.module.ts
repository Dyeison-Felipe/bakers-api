import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { RecipeSchema } from './database/typeorm/schema/recipe.schema';
import { RecipeItemSchema } from './database/typeorm/schema/recipe-item.schema';
import { RecipeRepositoryImpl } from './database/typeorm/repositories/recipe.repository';
import { RecipeItemRepositoryImpl } from './database/typeorm/repositories/recipe-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeSchema, RecipeItemSchema])],
  providers: [
    { provide: PROVIDERS.RECIPE_REPOSITORY, useClass: RecipeRepositoryImpl },
    {
      provide: PROVIDERS.RECIPE_ITEM_REPOSITORY,
      useClass: RecipeItemRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.RECIPE_REPOSITORY, PROVIDERS.RECIPE_ITEM_REPOSITORY],
})
export class RecipePersistenceModule {}
