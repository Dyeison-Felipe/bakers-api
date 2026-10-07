import { MigrationInterface, QueryRunner } from 'typeorm';

// Botão "Movimentar estoque" da tela de Estoque: entrada/baixa manual.
//
// 1. Novo motivo `MANUAL_ADJUSTMENT` no enum de `stock_movement.reason`.
// 2. Nova permissão `stock_movement.adjust`, propagada automaticamente pra
//    quem já tinha `stock_movement.reader` E `stock_movement.write_off`
//    (plano e usuário) — exigir as duas mantém a dependência
//    `adjust → reader` válida e não dá a ação a quem só consultava a tela.
export class AddStockMovementManualAdjustment1786100000060
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "stock_movement_reason_enum" ADD VALUE IF NOT EXISTS 'MANUAL_ADJUSTMENT'
    `);

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('adjust', 'stock_movement', 'Movimentar estoque (entrada/baixa manual)')
    `);

    await queryRunner.query(`
      INSERT INTO plan_permission (plan, permission)
      SELECT pp.plan, new_perm.id
      FROM plan_permission pp
      JOIN permission write_off_perm
        ON write_off_perm.id = pp.permission
        AND write_off_perm.subject = 'stock_movement'
        AND write_off_perm.action = 'write_off'
        AND write_off_perm.deleted_at IS NULL
      JOIN permission new_perm
        ON new_perm.subject = 'stock_movement'
        AND new_perm.action = 'adjust'
        AND new_perm.deleted_at IS NULL
      WHERE pp.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM plan_permission reader_pp
          JOIN permission reader_perm
            ON reader_perm.id = reader_pp.permission
            AND reader_perm.subject = 'stock_movement'
            AND reader_perm.action = 'reader'
            AND reader_perm.deleted_at IS NULL
          WHERE reader_pp.plan = pp.plan
            AND reader_pp.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM plan_permission existing
          WHERE existing.plan = pp.plan
            AND existing.permission = new_perm.id
            AND existing.deleted_at IS NULL
        )
    `);

    await queryRunner.query(`
      INSERT INTO user_permission ("user", permission)
      SELECT up."user", new_perm.id
      FROM user_permission up
      JOIN permission write_off_perm
        ON write_off_perm.id = up.permission
        AND write_off_perm.subject = 'stock_movement'
        AND write_off_perm.action = 'write_off'
        AND write_off_perm.deleted_at IS NULL
      JOIN permission new_perm
        ON new_perm.subject = 'stock_movement'
        AND new_perm.action = 'adjust'
        AND new_perm.deleted_at IS NULL
      WHERE up.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM user_permission reader_up
          JOIN permission reader_perm
            ON reader_perm.id = reader_up.permission
            AND reader_perm.subject = 'stock_movement'
            AND reader_perm.action = 'reader'
            AND reader_perm.deleted_at IS NULL
          WHERE reader_up."user" = up."user"
            AND reader_up.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_permission existing
          WHERE existing."user" = up."user"
            AND existing.permission = new_perm.id
            AND existing.deleted_at IS NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const adjustPermission = `
      SELECT id FROM permission WHERE subject = 'stock_movement' AND action = 'adjust'
    `;
    await queryRunner.query(
      `DELETE FROM plan_permission WHERE permission IN (${adjustPermission})`,
    );
    await queryRunner.query(
      `DELETE FROM user_permission WHERE permission IN (${adjustPermission})`,
    );
    await queryRunner.query(
      `DELETE FROM permission WHERE subject = 'stock_movement' AND action = 'adjust'`,
    );
    // Postgres não suporta remover valor de enum diretamente; o valor
    // MANUAL_ADJUSTMENT fica no tipo.
  }
}
