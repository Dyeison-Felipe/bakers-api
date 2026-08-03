// core/product/infra/typeorm/entities/product-additional-cost.schema.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductSchema } from './product.schema';
import { AdditionalCostSchema } from '@/core/additional-cost/infra/database/typeorm/schema/additional-cost.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';

@Entity('product_additional_cost')
export class ProductAdditionalCostSchema extends BaseSchema {

  @ManyToOne(() => ProductSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product' })
  product: ProductSchema;

  @ManyToOne(() => AdditionalCostSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'additional_cost' })
  additionalCost: AdditionalCostSchema;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;
}
