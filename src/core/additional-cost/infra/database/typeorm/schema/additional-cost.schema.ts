import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('additional_cost')
export class AdditionalCostSchema extends BaseSchema {
  @Column({ name: 'name', nullable: false, type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => CompanySchema, { nullable: true })
  @JoinColumn({ name: 'company' })
  company: CompanySchema;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
