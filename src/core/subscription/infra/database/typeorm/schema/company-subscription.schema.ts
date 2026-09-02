import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { PlanSchema } from '@/core/plan/infra/database/typeorm/schema/plan.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PaymentSchema } from './payment.schema';

@Entity('company_subscription')
export class CompanySubscriptionSchema extends BaseSchema {
  @ManyToOne(() => CompanySchema)
  @JoinColumn({
    name: 'company_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_company_subscription_company',
  })
  company: CompanySchema;

  @ManyToOne(() => PlanSchema)
  @JoinColumn({
    name: 'plan_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_company_subscription_plan',
  })
  plan: PlanSchema;

  @Column({ name: 'mercado_pago_subscription_id', type: 'varchar', nullable: false })
  mercadoPagoSubscriptionId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'active', 'cancelled', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'payer_email', type: 'varchar', nullable: false })
  payerEmail: string;

  @Column({ name: 'card_last_four_digits', type: 'varchar', length: 4, nullable: true })
  cardLastFourDigits: string | null;

  @Column({ name: 'card_brand', type: 'varchar', nullable: true })
  cardBrand: string | null;

  @OneToMany(() => PaymentSchema, (payment) => payment.companySubscription)
  payments: PaymentSchema[];
}
