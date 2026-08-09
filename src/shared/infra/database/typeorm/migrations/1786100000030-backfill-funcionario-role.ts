import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillFuncionarioRole1786100000030
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO role (id, name, company, created_at, updated_at, created_by, updated_by)
      SELECT
        public.uuid_generate_v4(),
        'Funcionário',
        c.id,
        now(),
        now(),
        '${ID_USER_DEFAULT}',
        '${ID_USER_DEFAULT}'
      FROM company c
      WHERE c.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM role r
          WHERE r.company = c.id AND r.name = 'Funcionário' AND r.deleted_at IS NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role WHERE name = 'Funcionário'
    `);
  }
}
