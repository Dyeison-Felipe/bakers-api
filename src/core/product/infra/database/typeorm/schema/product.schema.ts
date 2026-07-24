import { CategorySchema } from '@/core/category/infra/database/typeorm/schema/category.schema';
import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { DecimalColumnTransformer } from '@/shared/infra/database/typeorm/transformers/decimal.transformer';
import { TypeConsumptionUnit, TypeUnitOfMeasurement, TypeUnitOfPurchase } from '@/shared/infra/enums/product';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('product')
export class ProductSchema extends BaseSchema {
  @Column({ name: 'name', nullable: false, type: 'varchar' })
  name: string;

  @Column({ name: 'bar_code', nullable: true, type: 'varchar' })
  barCode: string | null;

  @Column({ name: 'scale_reference', nullable: true, type: 'varchar' })
  scaleReference: string | null;

  @Column({ name: 'ncm', nullable: false, type: 'varchar' })
  ncm: string;

  @Column({
    name: 'cost_price',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  costPrice: number;

  @Column({
    name: 'sale_price',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  salePrice: number | null;

  @Column({
    name: 'profit_price',
    nullable: false,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  profitPrice: number | null;

  @Column({
    name: 'unit_of_measurement',
    nullable: true,
    type: 'enum',
    enum: TypeUnitOfMeasurement,
  })
  unitOfMeasurement: TypeUnitOfMeasurement | null;

  @Column({
    name: 'consumer_unit',
    nullable: true,
    type: 'enum',
    enum: TypeConsumptionUnit
  })
  consumerUnit: TypeConsumptionUnit | null

  @Column({ name: 'expiration_date_in_days', nullable: true, type: 'varchar' })
  expirationDateInDays: string | null;

  @Column({
    name: 'stock_management',
    nullable: false,
    type: 'boolean',
    default: false,
  })
  stockManagement: boolean;

  @Column({ name: 'resale', nullable: false, type: 'boolean', default: false })
  resale: boolean;

  @Column({
    name: 'row_material',
    nullable: false,
    type: 'boolean',
    default: false,
  })
  rowMaterial: boolean;

  @Column({
    name: 'own_production',
    nullable: false,
    type: 'boolean',
    default: false,
  })
  ownProduction: boolean;

  @Column({
    name: 'row_material_resale',
    nullable: false,
    type: 'boolean',
    default: false,
  })
  rowMaterialResale: boolean;

  @Column({
    name: 'current_stock',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  currentStock: number | null;

  @Column({
    name: 'stock_min',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  stockMin: number | null;

  @Column({ name: 'active', nullable: false, type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'description', nullable: true, type: 'varchar' })
  description: string | null;

  @Column({
    name: 'purchase_unit',
    nullable: true,
    type: 'enum',
    enum: TypeUnitOfPurchase,
  })
  purchaseUnit: TypeUnitOfPurchase | null;

  @Column({
    name: 'quantity',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  quantity: number | null;

  @Column({
    name: 'weight',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  weight: number | null;

  @Column({
    name: 'volume',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalColumnTransformer(),
  })
  volume: number | null;

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

  @ManyToOne(() => CompanySchema, (company) => company.product)
  @JoinColumn({ name: 'company' })
  company: CompanySchema;

  @ManyToOne(() => CategorySchema, (category) => category.product)
  @JoinColumn({ name: 'category' })
  category: CategorySchema;
}
