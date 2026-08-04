import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('cash_register_session')
export class CashRegisterSessionSchema extends BaseSchema {
  @ManyToOne(() => CompanySchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: CompanySchema;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TypeCashRegisterSessionStatus,
  })
  status: TypeCashRegisterSessionStatus;

  @Column({
    name: 'opening_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  openingAmount: number;

  @Column({ name: 'opened_at', type: 'timestamp' })
  openedAt: Date;

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy: string;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string | null;

  @Column({
    name: 'total_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  totalCash: number | null;

  @Column({
    name: 'total_pix',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  totalPix: number | null;

  @Column({
    name: 'total_card',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  totalCard: number | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
