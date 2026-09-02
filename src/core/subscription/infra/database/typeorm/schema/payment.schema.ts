import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CompanySubscriptionSchema } from './company-subscription.schema';

@Entity('payment')
export class PaymentSchema extends BaseSchema {
  @ManyToOne(() => CompanySubscriptionSchema, (cs) => cs.payments)
  @JoinColumn({
    name: 'company_subscription_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_payment_company_subscription',
  })
  companySubscription: CompanySubscriptionSchema;

  @Column({ name: 'mercado_pago_payment_id', type: 'varchar', nullable: true })
  mercadoPagoPaymentId: string | null;

  @Column({ name: 'type', type: 'enum', enum: ['initial', 'renewal'] })
  type: string;

  @Column({ name: 'status', type: 'varchar', nullable: false })
  status: string;

  @Column({ name: 'status_detail', type: 'varchar', nullable: true })
  statusDetail: string | null;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  amount: number;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;
}
