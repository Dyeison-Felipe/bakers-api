import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { PlanPermissionSchema } from '@/core/plan-permission/infra/database/typeorm/schema/plan-permission.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('plan')
export class PlanSchema extends BaseSchema {
  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;

  @Column({ name: 'description', type: 'varchar', nullable: false })
  description: string;

  @Column({ name: 'price', type: 'int', nullable: false })
  price: number;

  @Column({ name: 'active', type: 'boolean', nullable: false })
  active: boolean;

  @Column({ name: 'duration', type: 'int', nullable: false })
  duration: number;

  @Column({ name: 'user_limit', type: 'int', nullable: true })
  userLimit: number | null;

  @OneToMany(() => CompanySchema, (company) => company.plan)
  company: CompanySchema[]

  @OneToMany(() => PlanPermissionSchema, (planPermission) => planPermission.plan)
  planPermission: PlanPermissionSchema[]

}
