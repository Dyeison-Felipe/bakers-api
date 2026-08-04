import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DateOnlyColumnTransformer } from '@/shared/infra/database/typeorm/transformers/date-only.transformer';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DailyProductionItemSchema } from './daily-production-item.schema';

@Entity('daily_production')
export class DailyProductionSchema extends BaseSchema {
  @ManyToOne(() => CompanySchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: CompanySchema;

  @Column({
    name: 'production_date',
    type: 'date',
    transformer: new DateOnlyColumnTransformer(),
  })
  productionDate: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TypeDailyProductionStatus,
  })
  status: TypeDailyProductionStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @OneToMany(
    () => DailyProductionItemSchema,
    (item) => item.dailyProduction,
  )
  items: DailyProductionItemSchema[];
}
