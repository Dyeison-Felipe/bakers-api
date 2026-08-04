import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsBatch1786100000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      { action: 'reader', subject: 'batch', description: 'Visualizar lotes' },
      {
        action: 'update',
        subject: 'batch',
        description: 'Corrigir lotes manualmente',
      },
      { action: 'delete', subject: 'batch', description: 'Excluir lotes' },
      {
        action: 'write_off',
        subject: 'batch',
        description: 'Dar baixa manual em lotes',
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
      DELETE FROM permission WHERE subject = 'batch'
    `);
  }
}
