import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BatchSchema } from './batch.schema';

@Entity('batch_movement')
export class BatchMovementSchema extends BaseSchema {
  @ManyToOne(() => BatchSchema, (batch) => batch.movements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: BatchSchema;

  @Column({ name: 'type', type: 'enum', enum: TypeBatchMovement })
  type: TypeBatchMovement;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  quantity: number;

  @Column({ name: 'reason', type: 'enum', enum: TypeBatchMovementReason })
  reason: TypeBatchMovementReason;

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
