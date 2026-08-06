import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { RecipeSchema } from './recipe.schema';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';

@Entity('recipe_item')
export class RecipeItemSchema extends BaseSchema {
  @ManyToOne(() => RecipeSchema, (recipe) => recipe.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe' })
  recipe: RecipeSchema;

  @ManyToOne(() => ProductSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material' })
  material: ProductSchema;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  quantity: number;
}
