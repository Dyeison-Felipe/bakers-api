import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsCompany1786100000027
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'reader',
        subject: 'company',
        description: 'Visualizar dados da empresa',
      },
      {
        action: 'update',
        subject: 'company',
        description: 'Atualizar dados da empresa',
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
      DELETE FROM permission WHERE subject = 'company'
    `);
  }
}
