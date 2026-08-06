import { RecipeItem } from '@/core/recipe/domain/entities/recipe-item.entity';
import { RecipeItemSchema } from '../../schema/recipe-item.schema';
import { RecipeMapper } from './recipe-mapper';
import { ProductMapper } from '@/core/product/infra/database/typeorm/repository/mappers/product.mapper';

export class RecipeItemMapper {
  static toEntity(schema: RecipeItemSchema): RecipeItem {
    return new RecipeItem({
      id: schema.id,
      recipe: RecipeMapper.toEntity(schema.recipe),
      material: ProductMapper.toEntity(schema.material),
      quantity: schema.quantity,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: RecipeItem): RecipeItemSchema {
    return RecipeItemSchema.with({
      id: entity.id,
      recipe: RecipeMapper.toReference(entity.recipe.id),
      material: ProductMapper.toReference(entity.material.id),
      quantity: entity.quantity,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
