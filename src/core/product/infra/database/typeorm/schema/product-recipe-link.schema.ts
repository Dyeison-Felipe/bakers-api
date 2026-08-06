// core/product/infra/typeorm/entities/product-recipe-link.schema.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ProductSchema } from './product.schema';
import { RecipeSchema } from '@/core/recipe/infra/database/typeorm/schema/recipe.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';

@Entity('product_recipe_link')
@Index('UQ_product_recipe_link_product_recipe', ['product', 'recipe'], {
  unique: true,
})
export class ProductRecipeLinkSchema extends BaseSchema {
  @ManyToOne(() => ProductSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product' })
  product: ProductSchema;

  @ManyToOne(() => RecipeSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipe' })
  recipe: RecipeSchema;
}
