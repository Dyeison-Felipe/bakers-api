import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Baixa de desperdício de matéria-prima (sem controle de estoque) não tem
 * lote nenhum pra amarrar o movimento — o `write-off` tentava alocar em
 * FEFO mesmo assim e falhava com "estoque insuficiente" pra qualquer
 * quantidade, já que não existe lote algum pra esses produtos.
 *
 * Adiciona `product_id` direto em `batch_movement` (sempre preenchido, novo
 * ou histórico) e torna `batch_id` opcional, pra permitir registrar um
 * movimento (com custo) sem precisar de um lote por trás.
 */
export class AddProductIdToBatchMovement1786100000048
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'batch_movement',
      new TableColumn({
        name: 'product_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE batch_movement bm
      SET product_id = b.product_id
      FROM batch b
      WHERE bm.batch_id = b.id
        AND bm.product_id IS NULL;
    `);

    await queryRunner.changeColumn(
      'batch_movement',
      'product_id',
      new TableColumn({
        name: 'product_id',
        type: 'uuid',
        isNullable: false,
      }),
    );

    await queryRunner.createForeignKey(
      'batch_movement',
      new TableForeignKey({
        name: 'FK_batch_movement_product',
        columnNames: ['product_id'],
        referencedTableName: 'product',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.changeColumn(
      'batch_movement',
      'batch_id',
      new TableColumn({
        name: 'batch_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'batch_movement',
      'batch_id',
      new TableColumn({
        name: 'batch_id',
        type: 'uuid',
        isNullable: false,
      }),
    );
    await queryRunner.dropForeignKey(
      'batch_movement',
      'FK_batch_movement_product',
    );
    await queryRunner.dropColumn('batch_movement', 'product_id');
  }
}
