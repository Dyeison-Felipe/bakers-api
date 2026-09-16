import { MigrationInterface, QueryRunner } from 'typeorm';

// Novas permissões dos relatórios de CPV, Margem de Contribuição e Curva ABC
// (ver PermissionReport). Só cria a permission — vincular aos Planos
// existentes é ação manual na tela de Planos, mesmo padrão já usado em
// 1786100000046 e 1786100000054.
//
// Ação manual pendente de sempre: marcar `report.cpv_reader`,
// `report.contribution_margin_reader` e `report.abc_curve_reader` nos
// Planos existentes (tela de Planos) — sem isso, ninguém vê essas abas em
// Relatórios, nem o Admin (a checagem de plano vale pra todo mundo).
export class AddReportCpvMarginAbcPermissions1786100000055
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES
        ('cpv_reader', 'report', 'Visualizar relatório de CPV (Custo dos Produtos Vendidos)'),
        ('contribution_margin_reader', 'report', 'Visualizar relatório de Margem de Contribuição'),
        ('abc_curve_reader', 'report', 'Visualizar relatório de Curva ABC')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission
        WHERE subject = 'report'
          AND action IN ('cpv_reader', 'contribution_margin_reader', 'abc_curve_reader')
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission
        WHERE subject = 'report'
          AND action IN ('cpv_reader', 'contribution_margin_reader', 'abc_curve_reader')
      )
    `);
    await queryRunner.query(`
      DELETE FROM permission
      WHERE subject = 'report'
        AND action IN ('cpv_reader', 'contribution_margin_reader', 'abc_curve_reader')
    `);
  }
}
