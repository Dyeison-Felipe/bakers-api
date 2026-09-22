import { MigrationInterface, QueryRunner } from 'typeorm';

// Separa a tela de Gastos adicionais de Produtos: hoje as duas usam
// `product.*`. Cria `additional_cost.{create,update,delete,reader}` e
// propaga automaticamente pra quem já tinha a permissão de `product`
// equivalente (plano e usuário), preservando o acesso atual.
export class AddAdditionalCostPermissions1786100000058
  implements MigrationInterface
{
  private readonly actions: Array<{ action: string; description: string }> = [
    { action: 'create', description: 'Criar gastos adicionais' },
    { action: 'update', description: 'Editar gastos adicionais' },
    { action: 'delete', description: 'Excluir gastos adicionais' },
    { action: 'reader', description: 'Visualizar gastos adicionais' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = this.actions
      .map((a) => `('${a.action}', 'additional_cost', '${a.description}')`)
      .join(', ');
    await queryRunner.query(
      `INSERT INTO permission (action, subject, description) VALUES ${values}`,
    );

    for (const { action } of this.actions) {
      await queryRunner.query(
        `
        INSERT INTO plan_permission (plan, permission)
        SELECT pp.plan, new_perm.id
        FROM plan_permission pp
        JOIN permission old_perm
          ON old_perm.id = pp.permission
          AND old_perm.subject = 'product'
          AND old_perm.action = $1
          AND old_perm.deleted_at IS NULL
        JOIN permission new_perm
          ON new_perm.subject = 'additional_cost'
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
          AND old_perm.subject = 'product'
          AND old_perm.action = $1
          AND old_perm.deleted_at IS NULL
        JOIN permission new_perm
          ON new_perm.subject = 'additional_cost'
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
        SELECT id FROM permission WHERE subject = 'additional_cost'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'additional_cost'
      )
    `);
    await queryRunner.query(`DELETE FROM permission WHERE subject = 'additional_cost'`);
  }
}
