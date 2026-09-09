import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFeaturesToPlan1786100000047 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'plan',
      new TableColumn({
        name: 'features',
        type: 'text',
        isArray: true,
        isNullable: false,
        default: "'{}'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('plan', 'features');
  }
}
