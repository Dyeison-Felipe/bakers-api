import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillStockManagementKgProducts1786100000032
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE product
      SET stock_management = false
      WHERE unit_of_measurement = 'kg' AND stock_management = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill não reversível: não há como saber quais linhas eram true antes.
  }
}
