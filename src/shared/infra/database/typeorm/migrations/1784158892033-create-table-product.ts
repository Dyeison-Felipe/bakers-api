import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableProduct1784158892033 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'public.uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'bar_code',
            type: 'varchar',
            length: '14',
            isNullable: true,
          },
          {
            name: 'scale_reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ncm',
            type: 'varchar',
            length: '8',
            isNullable: false,
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'price_per_kilogram',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'sale_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'profit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'unit_of_measurement',
            type: 'enum',
            enum: Object.values(TypeUnitOfMeasurement),
            isNullable: true,
          },
          {
            name: 'consumer_unit',
            type: 'enum',
            enum: Object.values(TypeConsumptionUnit),
            isNullable: true,
          },
          {
            name: 'type_product',
            type: 'enum',
            enum: Object.values(TypeProduct),
            isNullable: false,
          },
          {
            name: 'purchase_unit',
            type: 'enum',
            enum: Object.values(TypeUnitOfPurchase),
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'volume',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'expiration_date_in_days',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'stock_management',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'current_stock',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'stock_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'image_path',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'company',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_product_company',
            columnNames: ['company'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
          },
          {
            name: 'fk_product_category',
            columnNames: ['category'],
            referencedTableName: 'category',
            referencedColumnNames: ['id'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
