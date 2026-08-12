import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionReport1786100000034
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('reader', 'report', 'Visualizar relatórios (desperdício, caixa, produção, despesas)')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'report' AND action = 'reader'
    `);
  }
}
