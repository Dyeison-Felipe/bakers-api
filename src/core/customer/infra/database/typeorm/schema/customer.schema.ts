import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { AddressSchema } from '@/core/address/infra/database/typeorm/schema/address.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('customer')
export class CustomerSchema extends BaseSchema {
  @Column({ name: 'name', nullable: false, type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'cpf', nullable: false, type: 'varchar', length: 11 })
  cpf: string;

  @Column({ name: 'phone_number', nullable: false, type: 'varchar', length: 11 })
  phoneNumber: string;

  @Column({ name: 'email', nullable: false, type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'active', nullable: false, type: 'boolean', default: true })
  active: boolean;

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
    foreignKeyConstraintName: 'fk_customer_address',
  })
  @OneToOne(() => AddressSchema, { nullable: false })
  address: AddressSchema;

  @ManyToOne(() => CompanySchema)
  @JoinColumn({ name: 'company' })
  company: CompanySchema;
}
