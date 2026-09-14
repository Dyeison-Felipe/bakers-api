import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

// Substitui `batch_movement` (que dependia de `batch`, com lote/validade/FEFO)
// por um ledger simples direto no produto — sem lote nenhum por trás. Ver
// 1786100000052 (backfill) e 1786100000053 (drop de batch/batch_movement).
export class CreateTableStockMovement1786100000051
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stock_movement',
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
            name: 'type',
            type: 'enum',
            enum: Object.values(TypeStockMovement),
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'enum',
            enum: Object.values(TypeStockMovementReason),
            isNullable: false,
          },
          {
            name: 'reason_description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'unit_cost_snapshot',
            type: 'decimal',
            precision: 12,
            scale: 6,
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
        ],
        foreignKeys: [
          {
            name: 'FK_stock_movement_product',
            columnNames: ['product_id'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'stock_movement',
      new TableIndex({
        name: 'IDX_stock_movement_product_id',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'stock_movement',
      new TableIndex({
        name: 'IDX_stock_movement_reason_created_at',
        columnNames: ['reason', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'stock_movement',
      'IDX_stock_movement_reason_created_at',
    );
    await queryRunner.dropIndex(
      'stock_movement',
      'IDX_stock_movement_product_id',
    );
    await queryRunner.dropForeignKey(
      'stock_movement',
      'FK_stock_movement_product',
    );
    await queryRunner.dropTable('stock_movement');
  }
}
