import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateTableRecipeItem1786100000020
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'recipe_item',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'recipe', type: 'uuid', isNullable: false },
          { name: 'material', type: 'uuid', isNullable: false },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            isNullable: false,
          },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'FK_recipe_item_recipe',
            columnNames: ['recipe'],
            referencedTableName: 'recipe',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_recipe_item_material',
            columnNames: ['material'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'recipe_item',
      new TableIndex({
        name: 'IDX_recipe_item_recipe_id',
        columnNames: ['recipe'],
      }),
    );

    await queryRunner.createIndex(
      'recipe_item',
      new TableIndex({
        name: 'IDX_recipe_item_material_id',
        columnNames: ['material'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('recipe_item', 'IDX_recipe_item_material_id');
    await queryRunner.dropIndex('recipe_item', 'IDX_recipe_item_recipe_id');
    await queryRunner.dropTable('recipe_item');
  }
}
