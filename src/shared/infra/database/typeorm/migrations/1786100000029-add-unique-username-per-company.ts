import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUsernamePerCompany1786100000029
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_username_company"
      ON "user" ("username", "company")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "UQ_user_username_company"
    `);
  }
}
