import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableCompanySubscriptionAndPayment1786100000042
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'company_subscription',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'company_id', type: 'uuid', isNullable: false },
          { name: 'plan_id', type: 'uuid', isNullable: false },
          { name: 'mercado_pago_subscription_id', type: 'varchar', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'cancelled', 'rejected'],
            default: `'pending'`,
            isNullable: false,
          },
          { name: 'payer_email', type: 'varchar', isNullable: false },
          { name: 'card_last_four_digits', type: 'varchar', length: '4', isNullable: true },
          { name: 'card_brand', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'fk_company_subscription_company',
            columnNames: ['company_id'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_company_subscription_plan',
            columnNames: ['plan_id'],
            referencedTableName: 'plan',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'payment',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'company_subscription_id', type: 'uuid', isNullable: false },
          { name: 'mercado_pago_payment_id', type: 'varchar', isNullable: true },
          {
            name: 'type',
            type: 'enum',
            enum: ['initial', 'renewal'],
            isNullable: false,
          },
          { name: 'status', type: 'varchar', isNullable: false },
          { name: 'status_detail', type: 'varchar', isNullable: true },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'fk_payment_company_subscription',
            columnNames: ['company_subscription_id'],
            referencedTableName: 'company_subscription',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('payment', 'fk_payment_company_subscription');
    await queryRunner.dropTable('payment');

    await queryRunner.dropForeignKey(
      'company_subscription',
      'fk_company_subscription_plan',
    );
    await queryRunner.dropForeignKey(
      'company_subscription',
      'fk_company_subscription_company',
    );
    await queryRunner.dropTable('company_subscription');
  }
}
