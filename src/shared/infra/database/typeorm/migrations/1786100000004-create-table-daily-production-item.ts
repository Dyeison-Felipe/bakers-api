import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateTableDailyProductionItem1786100000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'daily_production_item',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'daily_production_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'unit_of_measurement',
            type: 'enum',
            enum: Object.values(TypeUnitOfMeasurement),
            isNullable: false,
          },
          {
            name: 'planned_quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'recipe_multiplier',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'planned_weight',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'unit_cost_price_snapshot',
            type: 'decimal',
            precision: 12,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'price_per_kilogram_snapshot',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'planned_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(TypeDailyProductionItemStatus),
            isNullable: false,
          },
          {
            name: 'actual_quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'actual_weight',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'produced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'produced_by',
            type: 'uuid',
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
            name: 'FK_daily_production_item_daily_production',
            columnNames: ['daily_production_id'],
            referencedTableName: 'daily_production',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_daily_production_item_product',
            columnNames: ['product_id'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'daily_production_item',
      new TableIndex({
        name: 'IDX_daily_production_item_daily_production_id',
        columnNames: ['daily_production_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'daily_production_item',
      'IDX_daily_production_item_daily_production_id',
    );
    await queryRunner.dropForeignKey(
      'daily_production_item',
      'FK_daily_production_item_product',
    );
    await queryRunner.dropForeignKey(
      'daily_production_item',
      'FK_daily_production_item_daily_production',
    );
    await queryRunner.dropTable('daily_production_item');
  }
}
