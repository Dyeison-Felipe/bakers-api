import { MigrationInterface, QueryRunner } from 'typeorm';

// Separa duas ações que hoje vivem dentro de `daily_production.update`:
// marcar item como produzido (`complete`) e cancelar item (`cancel`).
// `update` continua cobrindo criar/editar item planejado.
//
// Diferente das migrations anteriores de troca de permissão (que apagavam
// os vínculos e exigiam reconfiguração manual na tela de Planos), aqui o
// objetivo é o oposto: quem já tinha `daily_production.update` PRECISA
// continuar conseguindo produzir/cancelar item, então as novas permissões
// são propagadas automaticamente (backfill) pra todo `plan_permission` e
// `user_permission` que já tinha `update` — sem isso, o deploy tiraria
// acesso de gente no meio do dia de trabalho.
export class AddDailyProductionGranularActions1786100000056
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES
        ('complete', 'daily_production', 'Marcar item de produção diária como produzido'),
        ('cancel', 'daily_production', 'Cancelar item de produção diária')
    `);

    for (const action of ['complete', 'cancel']) {
      await queryRunner.query(
        `
        INSERT INTO plan_permission (plan, permission)
        SELECT pp.plan, new_perm.id
        FROM plan_permission pp
        JOIN permission old_perm
          ON old_perm.id = pp.permission
          AND old_perm.subject = 'daily_production'
          AND old_perm.action = 'update'
          AND old_perm.deleted_at IS NULL
        JOIN permission new_perm
          ON new_perm.subject = 'daily_production'
          AND new_perm.action = $1
          AND new_perm.deleted_at IS NULL
        WHERE pp.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM plan_permission existing
            WHERE existing.plan = pp.plan
              AND existing.permission = new_perm.id
              AND existing.deleted_at IS NULL
          )
        `,
        [action],
      );

      await queryRunner.query(
        `
        INSERT INTO user_permission ("user", permission)
        SELECT up."user", new_perm.id
        FROM user_permission up
        JOIN permission old_perm
          ON old_perm.id = up.permission
          AND old_perm.subject = 'daily_production'
          AND old_perm.action = 'update'
          AND old_perm.deleted_at IS NULL
        JOIN permission new_perm
          ON new_perm.subject = 'daily_production'
          AND new_perm.action = $1
          AND new_perm.deleted_at IS NULL
        WHERE up.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_permission existing
            WHERE existing."user" = up."user"
              AND existing.permission = new_perm.id
              AND existing.deleted_at IS NULL
          )
        `,
        [action],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'daily_production' AND action IN ('complete', 'cancel')
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'daily_production' AND action IN ('complete', 'cancel')
      )
    `);
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'daily_production' AND action IN ('complete', 'cancel')
    `);
  }
}
