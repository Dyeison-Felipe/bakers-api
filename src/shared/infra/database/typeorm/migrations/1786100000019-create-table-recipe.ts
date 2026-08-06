import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableRecipe1786100000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'recipe',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'company', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: false },
          { name: 'updated_by', type: 'uuid', isNullable: false },
          { name: 'deleted_by', type: 'uuid', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'FK_recipe_company',
            columnNames: ['company'],
            referencedTableName: 'company',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recipe');
  }
}
