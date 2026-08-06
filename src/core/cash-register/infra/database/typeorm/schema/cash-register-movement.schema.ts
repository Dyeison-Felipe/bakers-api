import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CashRegisterSessionSchema } from './cash-register-session.schema';

@Entity('cash_register_movement')
export class CashRegisterMovementSchema extends BaseSchema {
  @ManyToOne(() => CashRegisterSessionSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cash_register_session_id' })
  cashRegisterSession: CashRegisterSessionSchema;

  @Column({ name: 'type', type: 'enum', enum: TypeCashRegisterMovement })
  type: TypeCashRegisterMovement;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: TypeCashRegisterMovementReason,
  })
  reason: TypeCashRegisterMovementReason;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  amount: number;

  @Column({
    name: 'balance_before',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  balanceBefore: number;

  @Column({
    name: 'balance_after',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  balanceAfter: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;
}
