import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationToUser1786100000026
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "email_verified" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ALTER COLUMN "email_verified" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "email_verified_at" timestamp NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "email_verified_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "email_verified"
    `);
  }
}
