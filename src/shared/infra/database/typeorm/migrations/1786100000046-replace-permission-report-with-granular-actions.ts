import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplacePermissionReportWithGranularActions1786100000046
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // FK de plan_permission/user_permission para permission é RESTRICT —
    // precisa apagar as referências antes de apagar a permission antiga.
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'report' AND action = 'reader'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'report' AND action = 'reader'
      )
    `);
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'report' AND action = 'reader'
    `);

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES
        ('waste_reader', 'report', 'Visualizar relatório de desperdício'),
        ('cash_register_reader', 'report', 'Visualizar relatório de detalhe de caixa'),
        ('production_reader', 'report', 'Visualizar relatório de produção'),
        ('expense_reader', 'report', 'Visualizar relatório de despesas')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'report'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'report'
      )
    `);
    await queryRunner.query(`DELETE FROM permission WHERE subject = 'report'`);

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('reader', 'report', 'Visualizar relatórios (desperdício, caixa, produção, despesas)')
    `);
  }
}
