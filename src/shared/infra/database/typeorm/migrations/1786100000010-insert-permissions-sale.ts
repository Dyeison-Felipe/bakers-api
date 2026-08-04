import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsSale1786100000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'create',
        subject: 'sale',
        description: 'Registrar vendas no PDV',
      },
      {
        action: 'reader',
        subject: 'sale',
        description: 'Visualizar vendas e histórico de vendas',
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
      DELETE FROM permission WHERE subject = 'sale'
    `);
  }
}
