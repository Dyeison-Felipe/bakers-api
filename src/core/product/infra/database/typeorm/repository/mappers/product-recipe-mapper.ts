import { ProductRecipeItem } from '@/core/product/domain/entities/product-recipe-item.entity';
import { ProductRecipeItemSchema } from '../../schema/product-recipe-item';
import { ProductMapper } from './product.mapper';

export class ProductRecipeItemMapper {
  static toEntity(schema: ProductRecipeItemSchema): ProductRecipeItem {
    return new ProductRecipeItem({
      id: schema.id,
      product: ProductMapper.toEntity(schema.product),
      material: ProductMapper.toEntity(schema.material),
      quantity: schema.quantity,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: ProductRecipeItem): ProductRecipeItemSchema {
    return ProductRecipeItemSchema.with({
      id: entity.id,
      product: ProductMapper.toReference(entity.product.id),
      material: ProductMapper.toReference(entity.material.id),
      quantity: entity.quantity,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
