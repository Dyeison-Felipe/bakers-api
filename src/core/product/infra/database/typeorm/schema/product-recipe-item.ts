import { BaseSchema } from "@/shared/infra/database/typeorm/schema/baseSchema/baseSchema";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ProductSchema } from "./product.schema";

@Entity('product_recipe_item')
export class ProductRecipeItemSchema extends BaseSchema {
  @ManyToOne(() => ProductSchema, (product) => product.recipeItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSchema;

  @ManyToOne(() => ProductSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
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