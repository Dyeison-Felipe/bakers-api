import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTableProductRecipeItem1785461989916 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
          {
            name: 'product',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'material',
            type: 'uuid',
            isNullable: false,
          },
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
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

    await queryRunner.createIndex(
      'product_recipe_item',
      new TableIndex({
        name: 'IDX_product_recipe_item_product_id',
        columnNames: ['product'],
      }),
    );

    await queryRunner.createIndex(
      'product_recipe_item',
      new TableIndex({
        name: 'IDX_product_recipe_item_material_id',
        columnNames: ['material'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'product_recipe_item',
      'IDX_product_recipe_item_material',
    );
    await queryRunner.dropIndex(
      'product_recipe_item',
      'IDX_product_recipe_item_product',
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
}
