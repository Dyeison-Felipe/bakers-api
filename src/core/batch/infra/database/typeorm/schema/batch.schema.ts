import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { DateOnlyColumnTransformer } from '@/shared/infra/database/typeorm/transformers/date-only.transformer';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BatchMovementSchema } from './batch-movement.schema';

@Entity('batch')
export class BatchSchema extends BaseSchema {
  @ManyToOne(() => ProductSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSchema;

  @ManyToOne(() => CompanySchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: CompanySchema;

  @Column({ name: 'daily_production_item_id', type: 'uuid', nullable: true })
  dailyProductionItemId: string | null;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  quantity: number;

  @Column({
    name: 'remaining_quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  remainingQuantity: number;

  @Column({
    name: 'unit_of_measurement',
    type: 'enum',
    enum: TypeUnitOfMeasurement,
  })
  unitOfMeasurement: TypeUnitOfMeasurement;

  @Column({
    name: 'production_date',
    type: 'date',
    transformer: new DateOnlyColumnTransformer(),
  })
  productionDate: Date;

  @Column({
    name: 'expiration_date',
    type: 'date',
    nullable: true,
    transformer: new DateOnlyColumnTransformer(),
  })
  expirationDate: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @OneToMany(() => BatchMovementSchema, (movement) => movement.batch)
  movements: BatchMovementSchema[];
}
