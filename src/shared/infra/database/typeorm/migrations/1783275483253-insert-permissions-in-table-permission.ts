import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissionsInTablePermission1783275483253 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      // Category
      {
        action: 'create',
        subject: 'category',
        description: 'Criar categorias',
      },
      {
        action: 'update',
        subject: 'category',
        description: 'Editar categorias',
      },
      {
        action: 'delete',
        subject: 'category',
        description: 'Excluir categorias',
      },
      {
        action: 'reader',
        subject: 'category',
        description: 'Visualizar categorias',
      },

      // Plan
      { action: 'create', subject: 'plan', description: 'Criar planos' },
      { action: 'update', subject: 'plan', description: 'Editar planos' },
      { action: 'delete', subject: 'plan', description: 'Excluir planos' },
      {
        action: 'reader',
        subject: 'plan',
        description: 'Visualizar os planos',
      },

      // Product
      { action: 'create', subject: 'product', description: 'Criar produtos' },
      { action: 'update', subject: 'product', description: 'Editar produtos' },
      { action: 'delete', subject: 'product', description: 'Excluir produtos' },
      {
        action: 'reader',
        subject: 'product',
        description: 'Visualizar produtos',
      },

      // User
      { action: 'create', subject: 'user', description: 'Criar usuários' },
      { action: 'update', subject: 'user', description: 'Editar usuários' },
      { action: 'delete', subject: 'user', description: 'Excluir usuários' },
      { action: 'reader', subject: 'user', description: 'Visualizar usuários' },
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
    const subjects = ['category', 'plan', 'product', 'user'];

    await queryRunner.query(`
      DELETE FROM permission WHERE subject IN (${subjects.map((s) => `'${s}'`).join(', ')})
    `);
  }
}
