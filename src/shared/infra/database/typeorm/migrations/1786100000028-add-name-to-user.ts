import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameToUser1786100000028 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "name" varchar(255)
    `);

    await queryRunner.query(`
      UPDATE "user" SET "name" = "username" WHERE "name" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "name"
    `);
  }
}
