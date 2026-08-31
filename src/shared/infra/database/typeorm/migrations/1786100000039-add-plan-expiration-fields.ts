import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPlanExpirationFields1786100000039
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // plan.duration: texto livre ("12 meses") -> número de dias.
    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'duration_days',
        type: 'int',
        isNullable: true,
      }),
    );

    // Backfill best-effort: hoje só existe o seed "Extreme" ("12 meses").
    await queryRunner.query(`
      UPDATE plan SET duration_days = 365 WHERE duration_days IS NULL
    `);

    await queryRunner.changeColumn(
      'plan',
      'duration_days',
      new TableColumn({ name: 'duration_days', type: 'int', isNullable: false }),
    );

    await queryRunner.dropColumn('plan', 'duration');
    await queryRunner.renameColumn('plan', 'duration_days', 'duration');

    // company.plan_started_at / plan_expires_at: controle de vigência do plano.
    await queryRunner.addColumn(
      'company',
      new TableColumn({
        name: 'plan_started_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'company',
      new TableColumn({
        name: 'plan_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Backfill com NOW() (não created_at) para não expirar retroativamente
    // empresas já em uso no momento do deploy — cada uma ganha um ciclo
    // completo de vigência a partir desta migration.
    await queryRunner.query(`
      UPDATE company c
      SET plan_started_at = NOW(),
          plan_expires_at = NOW() + (p.duration || ' days')::interval
      FROM plan p
      WHERE p.id = c.plan AND c.plan_started_at IS NULL
    `);

    await queryRunner.changeColumn(
      'company',
      'plan_started_at',
      new TableColumn({
        name: 'plan_started_at',
        type: 'timestamp',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'company',
      'plan_expires_at',
      new TableColumn({
        name: 'plan_expires_at',
        type: 'timestamp',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('company', 'plan_expires_at');
    await queryRunner.dropColumn('company', 'plan_started_at');

    await queryRunner.renameColumn('plan', 'duration', 'duration_days');
    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'duration',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
    await queryRunner.query(`
      UPDATE plan SET duration = duration_days || ' dias'
    `);
    await queryRunner.dropColumn('plan', 'duration_days');
  }
}
