import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancelledStatusToDailyProductionItem1786100000016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "daily_production_item_status_enum" ADD VALUE IF NOT EXISTS 'CANCELLED'
    `);
  }

  public async down(): Promise<void> {
    // Postgres não suporta remover valor de enum diretamente; não há rollback.
  }
}
