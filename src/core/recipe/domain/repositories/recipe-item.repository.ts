import { RecipeItem } from '../entities/recipe-item.entity';

export interface RecipeItemRepository {
  save(entity: RecipeItem): Promise<RecipeItem>;
  findAllByRecipeId(recipeId: string): Promise<RecipeItem[]>;
  findAllByRecipeIds(recipeIds: string[]): Promise<RecipeItem[]>;
  deleteById(id: string): Promise<void>;
  deleteAllByRecipeId(recipeId: string): Promise<void>;
}
