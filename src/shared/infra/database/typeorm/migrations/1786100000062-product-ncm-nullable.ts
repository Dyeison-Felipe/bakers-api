import { MigrationInterface, QueryRunner } from 'typeorm';

// NCM passa a ser opcional: nem todo produto (ex.: insumos de uso interno)
// precisa de classificação fiscal no cadastro.
export class ProductNcmNullable1786100000062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "ncm" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "product" SET "ncm" = '' WHERE "ncm" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "ncm" SET NOT NULL`,
    );
  }
}
