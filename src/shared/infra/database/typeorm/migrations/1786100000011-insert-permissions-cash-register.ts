import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsCashRegister1786100000011
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'open',
        subject: 'cash_register',
        description: 'Abrir caixa do PDV',
      },
      {
        action: 'close',
        subject: 'cash_register',
        description: 'Fechar caixa do PDV',
      },
      {
        action: 'reader',
        subject: 'cash_register',
        description: 'Visualizar caixa do PDV',
      },
    ];

    const values = permissions
      .map((p) => `('${p.action}', '${p.subject}', '${p.description}')`)
      .join(', ');

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES ${values}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permission WHERE subject = 'cash_register'
    `);
  }
}
