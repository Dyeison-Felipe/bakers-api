import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// Remove o mecanismo de matéria-prima avulsa por completo. Só deve rodar
// depois de 1786100000049-backfill-product-recipe-item-to-recipe.ts (que
// converte todo vínculo existente para recipe/recipe_item/product_recipe_link)
// e da correspondente atualização de create/update-product.usecase.ts e
// find-daily-production-item-requirements.usecase.ts para pararem de ler
// desta tabela.
export class DropTableProductRecipeItem1786100000050
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'product_recipe_item',
      'IDX_product_recipe_item_material_id',
    );
    await queryRunner.dropIndex(
      'product_recipe_item',
      'IDX_product_recipe_item_product_id',
    );
    await queryRunner.dropForeignKey(
      'product_recipe_item',
      'FK_product_recipe_item_material',
    );
    await queryRunner.dropForeignKey(
      'product_recipe_item',
      'FK_product_recipe_item_product',
    );
    await queryRunner.dropTable('product_recipe_item');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria a estrutura vazia por simetria formal — não é reversível de
    // fato, os dados originais foram convertidos (não preservados) pelo
    // backfill anterior.
    await queryRunner.createTable(
      new Table({
        name: 'product_recipe_item',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'product', type: 'uuid', isNullable: false },
          { name: 'material', type: 'uuid', isNullable: false },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'FK_product_recipe_item_product',
            columnNames: ['product'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_product_recipe_item_material',
            columnNames: ['material'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );
  }
}
