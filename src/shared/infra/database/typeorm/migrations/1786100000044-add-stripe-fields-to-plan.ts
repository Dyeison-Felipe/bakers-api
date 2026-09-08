import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeFieldsToPlan1786100000044 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'stripe_product_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'stripe_price_id',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('plan', 'stripe_price_id');
    await queryRunner.dropColumn('plan', 'stripe_product_id');
  }
}
