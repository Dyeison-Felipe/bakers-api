import { MigrationInterface, QueryRunner } from 'typeorm';

// Inscrição estadual passa a ser opcional: empresas isentas (ou cuja IE não
// foi encontrada na consulta do CNPJ) precisam conseguir se cadastrar.
export class CompanyStateRegistrationNullable1786100000061
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "state_registration" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "company" SET "state_registration" = '' WHERE "state_registration" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "state_registration" SET NOT NULL`,
    );
  }
}
