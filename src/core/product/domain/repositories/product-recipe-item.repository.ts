import { ProductRecipeItem } from '../entities/product-recipe-item.entity';

export interface ProductRecipeItemRepository {
  save(entity: ProductRecipeItem): Promise<ProductRecipeItem>;
  findAllByProductIdAndCompanyId(
    productIds: string[],
    companyId: string,
  ): Promise<ProductRecipeItem[]>;
  findAllByProductId(productId: string): Promise<ProductRecipeItem[]>;
  deleteById(id: string): Promise<void>;
}
