import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsRecipe1786100000022
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      {
        action: 'create',
        subject: 'recipe',
        description: 'Criar receitas reutilizáveis',
      },
      {
        action: 'update',
        subject: 'recipe',
        description: 'Editar receitas reutilizáveis',
      },
      {
        action: 'delete',
        subject: 'recipe',
        description: 'Excluir receitas reutilizáveis',
      },
      {
        action: 'reader',
        subject: 'recipe',
        description: 'Visualizar receitas reutilizáveis',
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
      DELETE FROM permission WHERE subject = 'recipe'
    `);
  }
}
