import { MigrationInterface, QueryRunner } from 'typeorm';

// Copia o histórico de `batch_movement` pra `stock_movement`, direto por
// produto (sem lote). Só traz pra frente os motivos que os relatórios
// realmente consomem: PRODUCTION, SALE, WASTE e LEFTOVER_SOLD_AT_COST.
// MANUAL_DISCARD é dobrado em WASTE (mesma natureza — descarte manual —
// só existia como opção separada na tela de Lotes, que deixou de existir).
// CORRECTION/DELETION/MANUAL_ADJUSTMENT/MANUAL_CONSUMPTION eram só
// bookkeeping de lote (correção manual/exclusão de lote) e não tinham
// nenhum consumidor de leitura — não fazem sentido como "movimento de
// estoque do produto" e ficam de fora do backfill.
export class BackfillBatchMovementToStockMovement1786100000052
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO stock_movement (
        id, product_id, type, quantity, reason, reason_description,
        unit_cost_snapshot, created_at, updated_at, deleted_at, created_by
      )
      SELECT
        id,
        product_id,
        type::text::stock_movement_type_enum,
        quantity,
        (CASE WHEN reason::text = 'MANUAL_DISCARD' THEN 'WASTE' ELSE reason::text END)::stock_movement_reason_enum,
        reason_description,
        unit_cost_snapshot,
        created_at,
        updated_at,
        deleted_at,
        created_by
      FROM batch_movement
      WHERE reason::text IN ('PRODUCTION', 'SALE', 'WASTE', 'LEFTOVER_SOLD_AT_COST', 'MANUAL_DISCARD')
    `);
  }

  public async down(): Promise<void> {
    // Backfill não reversível: linhas de MANUAL_DISCARD já foram
    // fundidas em WASTE, sem como distinguir de volta.
  }
}
