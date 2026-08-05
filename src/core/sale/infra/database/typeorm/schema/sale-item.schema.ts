import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SaleSchema } from './sale.schema';

@Entity('sale_item')
export class SaleItemSchema extends BaseSchema {
  @ManyToOne(() => SaleSchema, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: SaleSchema;

  @ManyToOne(() => ProductSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSchema;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255 })
  productNameSnapshot: string;

  @Column({
    name: 'unit_of_measurement',
    type: 'enum',
    enum: TypeUnitOfMeasurement,
  })
  unitOfMeasurement: TypeUnitOfMeasurement;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  quantity: number | null;

  @Column({
    name: 'weight_in_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  weightInKg: number | null;

  @Column({
    name: 'unit_price_snapshot',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  unitPriceSnapshot: number;

  @Column({
    name: 'unit_cost_snapshot',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  unitCostSnapshot: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  subtotal: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
