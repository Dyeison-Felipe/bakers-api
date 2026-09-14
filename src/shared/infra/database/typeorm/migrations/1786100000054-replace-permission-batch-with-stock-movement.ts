import { MigrationInterface, QueryRunner } from 'typeorm';

// A tela de Lotes (e as ações de update/delete de lote) deixou de existir —
// só sobra a capacidade de registrar/ler desperdício, agora sob o subject
// `stock_movement`. Segue o mesmo padrão de troca de permissão já usado em
// 1786100000046 (report): apaga os vínculos de plan_permission/user_permission
// antes de apagar a permission antiga (FK é RESTRICT).
//
// Ação manual pendente de sempre: marcar `stock_movement.reader` e
// `stock_movement.write_off` nos Planos existentes (tela de Planos).
export class ReplacePermissionBatchWithStockMovement1786100000054
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'batch'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'batch'
      )
    `);
    await queryRunner.query(`DELETE FROM permission WHERE subject = 'batch'`);

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES
        ('reader', 'stock_movement', 'Visualizar movimentos de desperdício'),
        ('write_off', 'stock_movement', 'Registrar perda/desperdício de estoque')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plan_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'stock_movement'
      )
    `);
    await queryRunner.query(`
      DELETE FROM user_permission WHERE permission IN (
        SELECT id FROM permission WHERE subject = 'stock_movement'
      )
    `);
    await queryRunner.query(`DELETE FROM permission WHERE subject = 'stock_movement'`);

    await queryRunner.query(`
      INSERT INTO permission (action, subject, description)
      VALUES
        ('reader', 'batch', 'Visualizar lotes'),
        ('update', 'batch', 'Corrigir lotes'),
        ('delete', 'batch', 'Excluir lotes'),
        ('write_off', 'batch', 'Dar baixa em lotes')
    `);
  }
}
