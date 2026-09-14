import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('stock_movement')
export class StockMovementSchema extends BaseSchema {
  @ManyToOne(() => ProductSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSchema;

  @Column({ name: 'type', type: 'enum', enum: TypeStockMovement })
  type: TypeStockMovement;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  quantity: number;

  @Column({ name: 'reason', type: 'enum', enum: TypeStockMovementReason })
  reason: TypeStockMovementReason;

  @Column({
    name: 'reason_description',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reasonDescription: string | null;

  @Column({
    name: 'unit_cost_snapshot',
    type: 'decimal',
    precision: 12,
    scale: 6,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  unitCostSnapshot: number | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;
}
