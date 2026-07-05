import { AddressSchema } from '@/core/address/infra/database/typeorm/schema/address.schema';
import { CategorySchema } from '@/core/category/infra/database/typeorm/schema/category.schema';
import { PlanSchema } from '@/core/plan/infra/database/typeorm/schema/plan.schema';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { RoleSchema } from '@/core/role/infra/database/typeorm/schema/role.schema';
import { UserSchema } from '@/core/user/infra/database/typeorm/schema/user.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('company')
export class CompanySchema extends BaseSchema {
  @Column({
    name: 'fantasy_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  fantasyName: string;

  @Column({
    name: 'social_reazon',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  socialReazon: string;

  @Column({
    name: 'cnpj',
    type: 'varchar',
    length: 14,
    nullable: false,
  })
  cnpj: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 13,
    nullable: false,
  })
  phoneNumber: string;

  @Column({
    name: 'active',
    type: 'boolean',
    nullable: false,
  })
  active: boolean;

  @Column({
    name: 'state_registration',
    type: 'varchar',
    length: 14,
    nullable: false,
  })
  stateRegistration: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: false })
  updatedBy: string;

  @Column({
    name: 'deleted_by',
    type: 'uuid',
    nullable: true,
  })
  deletedBy: string | null;

  @JoinColumn({
    name: 'address',
    foreignKeyConstraintName: 'fk_company_address',
  })
  @OneToOne(() => AddressSchema, (address) => address.company)
  address: AddressSchema;

  @JoinColumn({
    name: 'plan',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_company_plan',
  })
  @ManyToOne(() => PlanSchema, (plan) => plan.company)
  plan: PlanSchema;

  @OneToMany(() => RoleSchema, (role) => role.company)
  role: RoleSchema[];

  @OneToMany(() => UserSchema, (user) => user.company)
  user: UserSchema[];

  @OneToMany(() => CategorySchema, (category) => category.company)
  category: CategorySchema[];

  @OneToMany(() => ProductSchema, (product) => product.company)
  product: ProductSchema[];
}
