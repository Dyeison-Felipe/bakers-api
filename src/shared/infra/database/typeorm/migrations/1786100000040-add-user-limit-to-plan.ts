import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserLimitToPlan1786100000040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // null = plano sem limite de usuários (ilimitado) — planos existentes
    // nascem sem restrição, sem precisar de backfill.
    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'user_limit',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('plan', 'user_limit');
  }
}
