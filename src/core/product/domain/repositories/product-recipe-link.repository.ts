// core/product/domain/repositories/product-recipe-link.repository.ts
import { ProductRecipeLink } from '../entities/product-recipe-link.entity';

export interface ProductRecipeLinkRepository {
  save(entity: ProductRecipeLink): Promise<ProductRecipeLink>;
  findAllByProductId(productId: string): Promise<ProductRecipeLink[]>;
  findAllByRecipeId(recipeId: string): Promise<ProductRecipeLink[]>;
  delete(id: string): Promise<void>;
}
