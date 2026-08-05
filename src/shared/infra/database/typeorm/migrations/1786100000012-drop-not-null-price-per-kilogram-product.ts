import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNotNullPricePerKilogramProduct1786100000012
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product" ALTER COLUMN "price_per_kilogram" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product" ALTER COLUMN "price_per_kilogram" SET NOT NULL
    `);
  }
}
