import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('category')
export class CategorySchema extends BaseSchema {
  @Column({ name: 'name', nullable: false, type: 'varchar', length: 255 })
  name: string;

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

  @ManyToOne(() => CompanySchema, (company) => company.category)
  @JoinColumn({ name: 'company' })
  company: CompanySchema;

  @ManyToOne(() => CategorySchema, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent' })
  parent: CategorySchema | null;

  @OneToMany(() => CategorySchema, (category) => category.parent)
  children: CategorySchema[];

  @OneToMany(() => ProductSchema, (product) => product.category)
  product: ProductSchema[];
}
