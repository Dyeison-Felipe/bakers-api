import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTableBatchMovement1786100000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'batch_movement',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'batch_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(TypeBatchMovement),
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
            enum: Object.values(TypeBatchMovementReason),
            isNullable: false,
          },
          {
            name: 'reason_description',
            type: 'varchar',
            length: '500',
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
            name: 'FK_batch_movement_batch',
            columnNames: ['batch_id'],
            referencedTableName: 'batch',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'batch_movement',
      new TableIndex({
        name: 'IDX_batch_movement_batch_id',
        columnNames: ['batch_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'batch_movement',
      'IDX_batch_movement_batch_id',
    );
    await queryRunner.dropForeignKey(
      'batch_movement',
      'FK_batch_movement_batch',
    );
    await queryRunner.dropTable('batch_movement');
  }
}
