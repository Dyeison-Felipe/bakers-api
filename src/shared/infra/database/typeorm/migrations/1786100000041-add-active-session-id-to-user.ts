import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddActiveSessionIdToUser1786100000041
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // null = sem sessão ativa registrada — usuários já logados no momento do
    // deploy simplesmente não são forçados a deslogar; a coluna só passa a
    // valer a partir do próximo login de cada um.
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'active_session_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'active_session_id');
  }
}
