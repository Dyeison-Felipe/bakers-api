import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DateOnlyColumnTransformer } from '@/shared/infra/database/typeorm/transformers/date-only.transformer';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('expense')
export class ExpenseSchema extends BaseSchema {
  @ManyToOne(() => CompanySchema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: CompanySchema;

  @Column({
    name: 'date',
    type: 'date',
    transformer: new DateOnlyColumnTransformer(),
  })
  date: Date;

  @Column({
    name: 'value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  value: number;

  @Column({ name: 'description', type: 'varchar', length: 255 })
  description: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
