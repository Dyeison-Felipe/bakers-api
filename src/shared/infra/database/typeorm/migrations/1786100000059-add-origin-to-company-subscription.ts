import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// Distingue a assinatura criada no cadastro da empresa ('signup') de uma
// assinatura nova feita de dentro do sistema ('renewal' — plano vencido ou
// troca do gratuito por um pago). Se a 1ª cobrança de uma 'renewal' for
// recusada, a empresa NÃO pode ser removida como acontece no cadastro.
// Tudo que já existe veio do cadastro.
export class AddOriginToCompanySubscription1786100000059
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'company_subscription',
      new TableColumn({
        name: 'origin',
        type: 'enum',
        enum: ['signup', 'renewal'],
        enumName: 'company_subscription_origin_enum',
        default: `'signup'`,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('company_subscription', 'origin');
    await queryRunner.query(
      `DROP TYPE IF EXISTS "company_subscription_origin_enum"`,
    );
  }
}
