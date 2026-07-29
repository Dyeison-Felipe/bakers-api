import { ProductRecipeItem } from '../entities/product-recipe-item.entity';

export interface ProductRecipeItemRepository {
  save(entity: ProductRecipeItem): Promise<ProductRecipeItem>;
  findAllByProductId(productId: string): Promise<ProductRecipeItem[]>;
}
