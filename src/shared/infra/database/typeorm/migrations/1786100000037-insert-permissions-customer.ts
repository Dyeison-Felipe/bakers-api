import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsCustomer1786100000037
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'create',
        subject: 'customer',
        description: 'Cadastrar clientes',
      },
      {
        action: 'update',
        subject: 'customer',
        description: 'Editar clientes',
      },
      {
        action: 'delete',
        subject: 'customer',
        description: 'Inativar clientes',
      },
      {
        action: 'reader',
        subject: 'customer',
        description: 'Visualizar clientes',
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
      DELETE FROM permission WHERE subject = 'customer'
    `);
  }
}
