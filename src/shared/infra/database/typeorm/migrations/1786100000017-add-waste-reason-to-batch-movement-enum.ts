import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWasteReasonToBatchMovementEnum1786100000017
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "batch_movement_reason_enum" ADD VALUE IF NOT EXISTS 'WASTE'
    `);
  }

  public async down(): Promise<void> {
    // Postgres não suporta remover valor de enum diretamente; não há rollback.
  }
}
