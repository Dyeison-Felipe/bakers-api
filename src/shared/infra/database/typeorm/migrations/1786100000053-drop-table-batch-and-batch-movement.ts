import { MigrationInterface, QueryRunner } from 'typeorm';

// Remove o mecanismo de lote (validade/FEFO) por completo — só depois do
// backfill em 1786100000052 ter copiado o histórico relevante pra
// `stock_movement`. A tela de Lotes e toda a lógica de baixa por FEFO foram
// substituídas por ajuste direto no estoque do produto.
export class DropTableBatchAndBatchMovement1786100000053
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'batch_movement',
      'IDX_batch_movement_batch_id',
    );
    await queryRunner.dropTable('batch_movement');

    await queryRunner.dropIndex(
      'batch',
      'IDX_batch_product_remaining_expiration',
    );
    await queryRunner.dropIndex('batch', 'IDX_batch_company_id');
    await queryRunner.dropTable('batch');
  }

  public async down(): Promise<void> {
    // Não reversível: recriar as tabelas vazias não devolveria os dados
    // (já convertidos para stock_movement pelo backfill anterior).
  }
}
