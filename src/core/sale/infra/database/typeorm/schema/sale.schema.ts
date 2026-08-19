import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { CashRegisterSessionSchema } from '@/core/cash-register/infra/database/typeorm/schema/cash-register-session.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SaleItemSchema } from './sale-item.schema';

@Entity('sale')
export class SaleSchema extends BaseSchema {
  @ManyToOne(() => CompanySchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: CompanySchema;

  @ManyToOne(() => CashRegisterSessionSchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cash_register_session_id' })
  cashRegisterSession: CashRegisterSessionSchema;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TypeSaleStatus,
  })
  status: TypeSaleStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: TypePaymentMethod,
  })
  paymentMethod: TypePaymentMethod;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  totalAmount: number;

  @Column({
    name: 'amount_received',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  amountReceived: number | null;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new DecimalColumnTransformer(),
  })
  changeAmount: number | null;

  @Column({ name: 'customer_cpf', type: 'varchar', length: 11, nullable: true })
  customerCpf: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({
    name: 'receipt_pdf_path',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  receiptPdfPath: string | null;

  @Column({ name: 'sold_by', type: 'uuid' })
  soldBy: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @OneToMany(() => SaleItemSchema, (item) => item.sale)
  items: SaleItemSchema[];
}
