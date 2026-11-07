import { MigrationInterface, QueryRunner } from 'typeorm';

// Novas dependências entre permissões (ver PERMISSION_DEPENDENCIES em
// core/auth/domain/permissions-definition/permission-dependencies.ts) — ex.:
// concluir produção agora exige visualizar a produção diária.
//
// Planos e usuários já existentes podem ter a permissão dependente sem a
// exigida (era possível salvar assim antes). Este backfill concede a(s)
// exigida(s) que faltam, pra que essas telas voltem a funcionar sem o Admin
// precisar reeditar cada usuário — e pra que salvar o usuário/plano de novo
// não falhe na validação.
//
// Lista copiada (snapshot) de propósito: migration não deve mudar de
// comportamento se o mapa do domínio mudar no futuro.
const DEPENDENCIES: [string, string][] = [
  ['category.create', 'category.reader'],
  ['category.update', 'category.reader'],
  ['category.delete', 'category.reader'],
  ['product.reader', 'category.reader'],
  ['product.create', 'product.reader'],
  ['product.create', 'recipe.reader'],
  ['product.update', 'product.reader'],
  ['product.update', 'recipe.reader'],
  ['product.delete', 'product.reader'],
  ['additional_cost.create', 'additional_cost.reader'],
  ['additional_cost.update', 'additional_cost.reader'],
  ['additional_cost.delete', 'additional_cost.reader'],
  ['recipe.create', 'recipe.reader'],
  ['recipe.update', 'recipe.reader'],
  ['recipe.delete', 'recipe.reader'],
  ['customer.create', 'customer.reader'],
  ['customer.update', 'customer.reader'],
  ['customer.delete', 'customer.reader'],
  ['daily_production.create', 'daily_production.reader'],
  ['daily_production.update', 'daily_production.reader'],
  ['daily_production.update', 'product.reader'],
  ['daily_production.delete', 'daily_production.reader'],
  ['daily_production.complete', 'daily_production.reader'],
  ['daily_production.cancel', 'daily_production.reader'],
  ['sale.create', 'cash_register.reader'],
  ['cash_register.open', 'cash_register.reader'],
  ['cash_register.close', 'cash_register.reader'],
  ['cash_register.movement_create', 'cash_register.reader'],
  ['stock_movement.reader', 'product.reader'],
  ['stock_movement.adjust', 'stock_movement.reader'],
  ['stock_movement.write_off', 'stock_movement.waste_reader'],
  ['stock_movement.write_off', 'product.reader'],
  ['expense.create', 'expense.reader'],
  ['expense.update', 'expense.reader'],
  ['expense.delete', 'expense.reader'],
  ['user.create', 'user.reader'],
  ['user.update', 'user.reader'],
  ['user.delete', 'user.reader'],
  ['company.update', 'company.reader'],
  ['report.waste_reader', 'stock_movement.waste_reader'],
  ['report.production_reader', 'daily_production.reader'],
  ['report.expense_reader', 'expense.reader'],
  ['report.cash_register_reader', 'cash_register.history_reader'],
  ['report.cpv_reader', 'sale.reader'],
  ['report.contribution_margin_reader', 'sale.reader'],
  ['report.abc_curve_reader', 'sale.reader'],
];

// Cadeia mais longa hoje tem 3 elos (ex.: stock_movement.adjust →
// stock_movement.reader → product.reader → category.reader); o limite só
// evita laço infinito em caso de erro.
const MAX_PASSES = 10;

// Tabela de ligação (plan_permission / user_permission) e a coluna do dono.
const TARGETS: { table: string; owner: string }[] = [
  { table: 'plan_permission', owner: 'plan' },
  { table: 'user_permission', owner: '"user"' },
];

export class BackfillPermissionDependencies1786100000063
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const pairs = DEPENDENCIES.map(([dependent, required]) => {
      const [depSubject, depAction] = dependent.split('.');
      const [reqSubject, reqAction] = required.split('.');
      return `('${depSubject}', '${depAction}', '${reqSubject}', '${reqAction}')`;
    }).join(',\n        ');

    for (const { table, owner } of TARGETS) {
      for (let pass = 0; pass < MAX_PASSES; pass++) {
        const inserted: unknown[] = await queryRunner.query(`
          WITH deps (dep_subject, dep_action, req_subject, req_action) AS (
            VALUES
            ${pairs}
          )
          INSERT INTO ${table} (${owner}, permission)
          SELECT DISTINCT link.${owner}, req_perm.id
          FROM ${table} link
          JOIN permission dep_perm
            ON dep_perm.id = link.permission
            AND dep_perm.deleted_at IS NULL
          JOIN deps
            ON deps.dep_subject = dep_perm.subject
            AND deps.dep_action = dep_perm.action
          JOIN permission req_perm
            ON req_perm.subject = deps.req_subject
            AND req_perm.action = deps.req_action
            AND req_perm.deleted_at IS NULL
          WHERE link.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM ${table} existing
              WHERE existing.${owner} = link.${owner}
                AND existing.permission = req_perm.id
                AND existing.deleted_at IS NULL
            )
          RETURNING 1
        `);

        if (!Array.isArray(inserted) || inserted.length === 0) break;
      }
    }
  }

  public async down(): Promise<void> {
    // Sem volta: não dá pra distinguir as permissões concedidas por este
    // backfill das que já tinham sido marcadas manualmente, e removê-las
    // deixaria telas quebradas de novo.
  }
}
