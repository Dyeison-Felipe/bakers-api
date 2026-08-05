import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitCostSnapshotToSaleItem1786100000015
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sale_item" ADD COLUMN "unit_cost_snapshot" decimal(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "sale_item" ALTER COLUMN "unit_cost_snapshot" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sale_item" DROP COLUMN "unit_cost_snapshot"
    `);
  }
}
