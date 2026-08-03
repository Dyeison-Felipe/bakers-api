import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableProductAdditionalCost1785698260120 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_additional_cost',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'product', type: 'uuid' },
          { name: 'additional_cost', type: 'uuid' },
          { name: 'value', type: 'decimal', precision: 12, scale: 2 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            name: 'FK_product_additional_costs_product',
            columnNames: ['product'],
            referencedTableName: 'product',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_product_additional_costs_additional_cost',
            columnNames: ['additional_cost'],
            referencedTableName: 'additional_cost',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
