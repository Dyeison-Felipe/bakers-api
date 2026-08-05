import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitCostSnapshotToBatchMovement1786100000018
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "batch_movement" ADD COLUMN "unit_cost_snapshot" decimal(12,6) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "batch_movement" DROP COLUMN "unit_cost_snapshot"
    `);
  }
}
