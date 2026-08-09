import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionCashRegisterHistory1786100000031
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('history_reader', 'cash_register', 'Visualizar histórico de sessões de caixa')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'cash_register' AND action = 'history_reader'
    `);
  }
}
