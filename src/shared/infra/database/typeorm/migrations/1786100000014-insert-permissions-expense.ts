import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsExpense1786100000014
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      { action: 'create', subject: 'expense', description: 'Lançar despesas' },
      {
        action: 'update',
        subject: 'expense',
        description: 'Atualizar despesas',
      },
      { action: 'delete', subject: 'expense', description: 'Excluir despesas' },
      {
        action: 'reader',
        subject: 'expense',
        description: 'Visualizar despesas',
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
      DELETE FROM permission WHERE subject = 'expense'
    `);
  }
}
