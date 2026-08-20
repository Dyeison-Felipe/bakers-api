import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableSale1786100000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sale',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'cash_register_session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(TypeSaleStatus),
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: Object.values(TypePaymentMethod),
            isNullable: false,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'amount_received',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'change_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'customer_cpf',
            type: 'varchar',
            length: '11',
            isNullable: true,
          },
          {
            name: 'receipt_pdf_path',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sold_by',
            type: 'uuid',
            isNullable: false,
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
            name: 'FK_sale_company',
            columnNames: ['company_id'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'FK_sale_cash_register_session',
            columnNames: ['cash_register_session_id'],
            referencedTableName: 'cash_register_session',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('sale', 'FK_sale_cash_register_session');
    await queryRunner.dropForeignKey('sale', 'FK_sale_company');
    await queryRunner.dropTable('sale');
  }
}
