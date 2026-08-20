import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTableProductRecipeLink1786100000021
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_recipe_link',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'product', type: 'uuid', isNullable: false },
          { name: 'recipe', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'FK_product_recipe_link_product',
            columnNames: ['product'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_product_recipe_link_recipe',
            columnNames: ['recipe'],
            referencedTableName: 'recipe',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'product_recipe_link',
      new TableIndex({
        name: 'UQ_product_recipe_link_product_recipe',
        columnNames: ['product', 'recipe'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'product_recipe_link',
      'UQ_product_recipe_link_product_recipe',
    );
    await queryRunner.dropTable('product_recipe_link');
  }
}
