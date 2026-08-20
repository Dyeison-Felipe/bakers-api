import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTableBatch1786100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'batch',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'daily_production_item_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'remaining_quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'unit_of_measurement',
            type: 'enum',
            enum: Object.values(TypeUnitOfMeasurement),
            isNullable: false,
          },
          {
            name: 'production_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'expiration_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
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
            name: 'FK_batch_product',
            columnNames: ['product_id'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'FK_batch_company',
            columnNames: ['company_id'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'batch',
      new TableIndex({
        name: 'IDX_batch_product_remaining_expiration',
        columnNames: ['product_id', 'remaining_quantity', 'expiration_date'],
      }),
    );

    await queryRunner.createIndex(
      'batch',
      new TableIndex({
        name: 'IDX_batch_company_id',
        columnNames: ['company_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('batch', 'IDX_batch_company_id');
    await queryRunner.dropIndex(
      'batch',
      'IDX_batch_product_remaining_expiration',
    );
    await queryRunner.dropForeignKey('batch', 'FK_batch_company');
    await queryRunner.dropForeignKey('batch', 'FK_batch_product');
    await queryRunner.dropTable('batch');
  }
}
