import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsDailyProduction1786100000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'create',
        subject: 'daily_production',
        description: 'Criar produções diárias',
      },
      {
        action: 'update',
        subject: 'daily_production',
        description: 'Editar produções diárias e produzir itens',
      },
      {
        action: 'delete',
        subject: 'daily_production',
        description: 'Remover itens de produções diárias',
      },
      {
        action: 'reader',
        subject: 'daily_production',
        description: 'Visualizar produções diárias',
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
      DELETE FROM permission WHERE subject = 'daily_production'
    `);
  }
}
