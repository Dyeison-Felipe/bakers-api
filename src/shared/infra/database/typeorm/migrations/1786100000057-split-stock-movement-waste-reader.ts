import { MigrationInterface, QueryRunner } from 'typeorm';

// `stock_movement.reader` hoje serve pra duas telas ao mesmo tempo: Estoque
// (GET /v1/stock-movement) e Desperdício (GET /v1/stock-movement/waste).
// Separa Desperdício numa ação própria (`waste_reader`); Estoque continua em
// `reader`. Mesmo raciocínio de propagação automática da migration anterior:
// quem já podia ver as duas telas continua podendo, sem reconfiguração manual.
export class SplitStockMovementWasteReader1786100000057
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('waste_reader', 'stock_movement', 'Visualizar a tela de Desperdício')
    `);

    await queryRunner.query(`
      INSERT INTO plan_permission (plan, permission)
      SELECT pp.plan, new_perm.id
      FROM plan_permission pp
      JOIN permission old_perm
        ON old_perm.id = pp.permission
        AND old_perm.subject = 'stock_movement'
        AND old_perm.action = 'reader'
        AND old_perm.deleted_at IS NULL
      JOIN permission new_perm
        ON new_perm.subject = 'stock_movement'
        AND new_perm.action = 'waste_reader'
        AND new_perm.deleted_at IS NULL
      WHERE pp.deleted_at IS NULL
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
      JOIN permission old_perm
        ON old_perm.id = up.permission
        AND old_perm.subject = 'stock_movement'
        AND old_perm.action = 'reader'
        AND old_perm.deleted_at IS NULL
      JOIN permission new_perm
        ON new_perm.subject = 'stock_movement'
        AND new_perm.action = 'waste_reader'
        AND new_perm.deleted_at IS NULL
      WHERE up.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM user_permission existing
          WHERE existing."user" = up."user"
            AND existing.permission = new_perm.id
            AND existing.deleted_at IS NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'stock_movement' AND action = 'waste_reader'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'stock_movement' AND action = 'waste_reader'
      )
    `);
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'stock_movement' AND action = 'waste_reader'
    `);
  }
}
