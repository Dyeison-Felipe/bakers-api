import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { PermissionReport } from './report';
import { PermissionStockMovement } from './stock-movement';
import { PermissionDailyProduction } from './daily-production';
import { PermissionExpense } from './expense';
import { PermissionCashRegister } from './cash-register';
import { PermissionSale } from './sale';

export type PermissionRef = { action: string; resource: string };

const key = (ref: PermissionRef): string => `${ref.resource}.${ref.action}`;

/**
 * Permissões que exigem outra(s) já concedida(s) no mesmo conjunto. Hoje
 * cobre só os relatórios (cada um depende da tela de origem dos dados que
 * mostra) — ex.: sem `stock_movement.waste_reader` (tela de Desperdício),
 * não é possível conceder `report.waste_reader`, senão o usuário veria dados
 * de uma tela que não pode acessar.
 *
 * Usado tanto na atribuição de permissões a um usuário (Admin da empresa)
 * quanto na montagem de um plano (Super Admin) — ver
 * `validatePermissionDependencies`.
 */
export const PERMISSION_DEPENDENCIES: Record<string, PermissionRef[]> = {
  [key(PermissionReport.REPORT_WASTE_READER)]: [
    PermissionStockMovement.STOCK_MOVEMENT_WASTE_READER,
  ],
  [key(PermissionReport.REPORT_PRODUCTION_READER)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
  ],
  [key(PermissionReport.REPORT_EXPENSE_READER)]: [
    PermissionExpense.EXPENSE_READER,
  ],
  [key(PermissionReport.REPORT_CASH_REGISTER_READER)]: [
    PermissionCashRegister.CASH_REGISTER_HISTORY_READER,
  ],
  [key(PermissionReport.REPORT_CPV_READER)]: [PermissionSale.SALE_READER],
  [key(PermissionReport.REPORT_CONTRIBUTION_MARGIN_READER)]: [
    PermissionSale.SALE_READER,
  ],
  [key(PermissionReport.REPORT_ABC_CURVE_READER)]: [PermissionSale.SALE_READER],
};

/**
 * Valida que toda permissão do conjunto `refs` que exige outra(s) (ver
 * `PERMISSION_DEPENDENCIES`) também tem a(s) exigida(s) presente(s) no mesmo
 * conjunto. Lança `BadRequestError` citando a permissão e o que falta —
 * chamada em create/update de usuário e de plano, sempre com a lista final
 * (já resolvida) de permissões que vai ser persistida.
 */
export const validatePermissionDependencies = (refs: PermissionRef[]): void => {
  const granted = new Set(refs.map(key));

  for (const ref of refs) {
    const requires = PERMISSION_DEPENDENCIES[key(ref)];
    if (!requires) continue;

    const missing = requires.filter((req) => !granted.has(key(req)));
    if (missing.length === 0) continue;

    throw new BadRequestError(
      `A permissão "${ref.resource}.${ref.action}" exige também: ${missing
        .map((m) => `${m.resource}.${m.action}`)
        .join(', ')}`,
    );
  }
};
