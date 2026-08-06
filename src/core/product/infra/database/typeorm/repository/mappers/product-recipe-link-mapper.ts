import { ProductRecipeLink } from '@/core/product/domain/entities/product-recipe-link.entity';
import { ProductRecipeLinkSchema } from '../../schema/product-recipe-link.schema';
import { ProductMapper } from './product.mapper';
import { RecipeMapper } from '@/core/recipe/infra/database/typeorm/repositories/mappers/recipe-mapper';

export class ProductRecipeLinkMapper {
  static toEntity(schema: ProductRecipeLinkSchema): ProductRecipeLink {
    return new ProductRecipeLink({
      id: schema.id,
      product: ProductMapper.toEntity(schema.product),
      recipe: RecipeMapper.toEntity(schema.recipe),
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: ProductRecipeLink): ProductRecipeLinkSchema {
    const schema = new ProductRecipeLinkSchema();
    schema.id = entity.id;
    schema.product = ProductMapper.toReference(entity.product!.id);
    schema.recipe = RecipeMapper.toReference(entity.recipe!.id);
    return schema;
  }
}
