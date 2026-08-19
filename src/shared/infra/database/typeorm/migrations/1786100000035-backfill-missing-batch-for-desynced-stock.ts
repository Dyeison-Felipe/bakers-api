import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige produtos com `stock_management=true` e `current_stock > 0` cujo
 * estoque não é coberto por nenhum lote em `batch` (bug: cadastro/edição de
 * produto gravava `current_stock` direto, sem criar lote — a baixa por venda
 * só enxerga `batch`, então a venda falhava com "estoque insuficiente" mesmo
 * com estoque visível no cadastro). Cria um lote corretivo cobrindo a
 * diferença, com o respectivo `batch_movement` (reason=CORRECTION).
 *
 * Produtos de empresas sem nenhum usuário cadastrado são ignorados (não há
 * `created_by` válido para o lote corretivo).
 */
export class BackfillMissingBatchForDesyncedStock1786100000035
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH desynced AS (
        SELECT
          p.id AS product_id,
          p.company AS company_id,
          (p.current_stock - COALESCE(cov.covered, 0)) AS missing_quantity,
          COALESCE(p.unit_of_measurement::text, 'un') AS unit_text,
          p.expiration_date_in_days,
          (
            SELECT u.id FROM "user" u
            WHERE u.company = p.company
            ORDER BY u.created_at ASC
            LIMIT 1
          ) AS user_id
        FROM product p
        LEFT JOIN (
          SELECT product_id, SUM(remaining_quantity) AS covered
          FROM batch
          WHERE deleted_at IS NULL
          GROUP BY product_id
        ) cov ON cov.product_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.stock_management = true
          AND p.current_stock IS NOT NULL
          AND p.current_stock > 0
          AND (p.current_stock - COALESCE(cov.covered, 0)) > 0
      ),
      eligible AS (
        SELECT * FROM desynced WHERE user_id IS NOT NULL
      ),
      inserted_batch AS (
        INSERT INTO batch (
          id, product_id, company_id, daily_production_item_id,
          quantity, remaining_quantity, unit_of_measurement,
          production_date, expiration_date,
          created_at, updated_at,
          created_by, updated_by, deleted_by
        )
        SELECT
          public.uuid_generate_v4(),
          e.product_id,
          e.company_id,
          NULL,
          e.missing_quantity,
          e.missing_quantity,
          e.unit_text::"batch_unit_of_measurement_enum",
          CURRENT_DATE,
          CASE
            WHEN e.expiration_date_in_days ~ '^[0-9]+$'
              AND e.expiration_date_in_days::int > 0
              THEN CURRENT_DATE + (e.expiration_date_in_days || ' days')::interval
            ELSE NULL
          END,
          now(), now(),
          e.user_id, e.user_id, NULL
        FROM eligible e
        RETURNING id, quantity, created_by
      )
      INSERT INTO batch_movement (
        id, batch_id, type, quantity, reason, reason_description,
        unit_cost_snapshot, created_at, updated_at, created_by
      )
      SELECT
        public.uuid_generate_v4(),
        ib.id,
        'ENTRY'::"batch_movement_type_enum",
        ib.quantity,
        'CORRECTION'::"batch_movement_reason_enum",
        'Correção automática: estoque cadastrado sem lote correspondente',
        NULL,
        now(), now(),
        ib.created_by
      FROM inserted_batch ib;
    `);
  }

  public async down(): Promise<void> {
    // Backfill não reversível: não há como distinguir lotes corretivos de
    // lotes legítimos criados depois desta migration.
  }
}
