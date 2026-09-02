import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePlanPriceToDecimal1786100000043
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // price sempre foi int (só reais inteiros) — planos com centavos (ex:
    // R$ 29,99) davam erro de sintaxe no Postgres ao salvar. ALTER ... TYPE
    // direto em vez de changeColumn(): a tabela já tem linhas, e o
    // changeColumn() do TypeORM recria a coluna do zero (NOT NULL sem
    // default) quando o tipo muda, o que falha em tabela não-vazia. Cast
    // direto (int -> decimal) não perde dados, então não precisa de
    // backfill.
    await queryRunner.query(
      `ALTER TABLE "plan" ALTER COLUMN "price" TYPE decimal(10,2) USING "price"::decimal(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan" ALTER COLUMN "price" TYPE int USING round("price")::int`,
    );
  }
}
