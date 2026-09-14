import { MigrationInterface, QueryRunner } from 'typeorm';

// Migra o vínculo avulso de matéria-prima (product_recipe_item, produto ->
// matéria-prima direto) para o mecanismo de receita reutilizável (recipe +
// recipe_item + product_recipe_link), que passa a ser o único caminho
// suportado pela aplicação. Para cada produto com ao menos um
// product_recipe_item não deletado, cria 1 recipe nova ("Receita - {nome do
// produto}"), copia os itens para recipe_item, e liga produto -> receita via
// product_recipe_link. Os valores de custo já gravados em product
// (cost_price, unit_cost_price, price_per_kilogram, sale_price, profit_price)
// não mudam — a fórmula de custo é a mesma soma, só muda o caminho de vínculo.
export class BackfillProductRecipeItemToRecipe1786100000049
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMP TABLE tmp_product_recipe_map (
        product_id uuid PRIMARY KEY,
        recipe_id uuid NOT NULL
      ) ON COMMIT DROP
    `);

    await queryRunner.query(`
      INSERT INTO tmp_product_recipe_map (product_id, recipe_id)
      SELECT DISTINCT pri.product, gen_random_uuid()
      FROM product_recipe_item pri
      WHERE pri.deleted_at IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO recipe (id, name, company, created_by, updated_by, created_at, updated_at)
      SELECT m.recipe_id, 'Receita - ' || p.name, p.company, p.created_by, p.updated_by, now(), now()
      FROM tmp_product_recipe_map m
      JOIN product p ON p.id = m.product_id
    `);

    await queryRunner.query(`
      INSERT INTO recipe_item (id, recipe, material, quantity, created_at, updated_at)
      SELECT gen_random_uuid(), m.recipe_id, pri.material, pri.quantity, now(), now()
      FROM product_recipe_item pri
      JOIN tmp_product_recipe_map m ON m.product_id = pri.product
      WHERE pri.deleted_at IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO product_recipe_link (id, product, recipe, created_at, updated_at)
      SELECT gen_random_uuid(), m.product_id, m.recipe_id, now(), now()
      FROM tmp_product_recipe_map m
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill não reversível: as receitas criadas aqui já podem ter sido
    // editadas/vinculadas a outros produtos por quem usou o sistema depois.
  }
}
