import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionCashRegisterMovement1786100000025
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ('movement_create', 'cash_register', 'Registrar sangria ou incremento no caixa')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'cash_register' AND action = 'movement_create'
    `);
  }
}
