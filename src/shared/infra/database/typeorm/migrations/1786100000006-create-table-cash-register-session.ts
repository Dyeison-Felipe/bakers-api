import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTableCashRegisterSession1786100000006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cash_register_session',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(TypeCashRegisterSessionStatus),
            isNullable: false,
          },
          {
            name: 'opening_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'opened_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'opened_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'closed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'closed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'total_cash',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_pix',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_card',
            type: 'decimal',
            precision: 10,
            scale: 2,
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
            name: 'FK_cash_register_session_company',
            columnNames: ['company_id'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    // Garante um único caixa aberto por company mesmo sob concorrência.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_cash_register_session_open_company"
      ON "cash_register_session" ("company_id")
      WHERE "status" = 'OPEN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_cash_register_session_open_company"`,
    );
    await queryRunner.dropForeignKey(
      'cash_register_session',
      'FK_cash_register_session_company',
    );
    await queryRunner.dropTable('cash_register_session');
  }
}
