import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DailyProductionSchema } from './daily-production.schema';

@Entity('daily_production_item')
export class DailyProductionItemSchema extends BaseSchema {
  @ManyToOne(() => DailyProductionSchema, (dailyProduction) => dailyProduction.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_production_id' })
  dailyProduction: DailyProductionSchema;

  @ManyToOne(() => ProductSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSchema;

  @Column({
    name: 'unit_of_measurement',
    type: 'enum',
    enum: TypeUnitOfMeasurement,
  })
  unitOfMeasurement: TypeUnitOfMeasurement;

  @Column({
    name: 'planned_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  plannedQuantity: number | null;

  @Column({
    name: 'recipe_multiplier',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  recipeMultiplier: number | null;

  @Column({
    name: 'planned_weight',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  plannedWeight: number | null;

  @Column({
    name: 'unit_cost_price_snapshot',
    type: 'decimal',
    precision: 12,
    scale: 6,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  unitCostPriceSnapshot: number | null;

  @Column({
    name: 'price_per_kilogram_snapshot',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  pricePerKilogramSnapshot: number | null;

  @Column({
    name: 'planned_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  plannedCost: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TypeDailyProductionItemStatus,
  })
  status: TypeDailyProductionItemStatus;

  @Column({
    name: 'actual_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  actualQuantity: number | null;

  @Column({
    name: 'actual_weight',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  actualWeight: number | null;

  @Column({ name: 'produced_at', type: 'timestamp', nullable: true })
  producedAt: Date | null;

  @Column({ name: 'produced_by', type: 'uuid', nullable: true })
  producedBy: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
