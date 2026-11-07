import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { PermissionReport } from './report';
import { PermissionStockMovement } from './stock-movement';
import { PermissionDailyProduction } from './daily-production';
import { PermissionExpense } from './expense';
import { PermissionCashRegister } from './cash-register';
import { PermissionSale } from './sale';
import { PermissionCategory } from './category';
import { PermissionProduct } from './product';
import { PermissionAdditionalCost } from './additional-cost';
import { PermissionRecipe } from './recipe';
import { PermissionCustomer } from './customer';
import { PermissionUser } from './user';
import { PermissionCompany } from './company';

export type PermissionRef = { action: string; resource: string };

export const permissionKey = (ref: PermissionRef): string =>
  `${ref.resource}.${ref.action}`;

const key = permissionKey;

/**
 * Permissões que exigem outra(s) já concedida(s) no mesmo conjunto. Três
 * tipos de dependência:
 *
 * 1. **Ação dentro de uma tela → visualizar a tela.** Criar/editar/excluir
 *    (e ações específicas como concluir/cancelar produção, abrir/fechar
 *    caixa) só fazem sentido se o usuário consegue abrir a tela onde o botão
 *    fica — ex.: `daily_production.complete` exige `daily_production.reader`.
 * 2. **Tela que consulta dados de outro módulo.** A tela quebraria (403) sem
 *    a leitura do outro módulo — ex.: a tela de Estoque lista os produtos
 *    (`product.reader`), a lista de Produtos filtra por categoria
 *    (`category.reader`), o PDV consulta o caixa aberto
 *    (`cash_register.reader`).
 * 3. **Relatórios → tela de origem dos dados** — sem
 *    `stock_movement.waste_reader` (tela de Desperdício) não é possível
 *    conceder `report.waste_reader`, senão o usuário veria dados de uma tela
 *    que não pode acessar.
 *
 * As dependências são transitivas (ex.: `stock_movement.adjust` →
 * `stock_movement.reader` → `product.reader` → `category.reader`); como a
 * validação recebe o conjunto final, cada elo é checado individualmente.
 *
 * Usado tanto na atribuição de permissões a um usuário (Admin da empresa)
 * quanto na montagem de um plano (Super Admin) — ver
 * `validatePermissionDependencies`. Espelhado no frontend em
 * `bakers-web/src/constants/permissionDependencies.ts` — manter iguais.
 */
export const PERMISSION_DEPENDENCIES: Record<string, PermissionRef[]> = {
  // Categorias
  [key(PermissionCategory.CATEGORY_CREATE)]: [PermissionCategory.CATEGORY_READER],
  [key(PermissionCategory.CATEGORY_UPDATE)]: [PermissionCategory.CATEGORY_READER],
  [key(PermissionCategory.CATEGORY_DELETE)]: [PermissionCategory.CATEGORY_READER],

  // Produtos — a lista filtra por categoria; o formulário vincula receitas.
  [key(PermissionProduct.PRODUCT_READER)]: [PermissionCategory.CATEGORY_READER],
  [key(PermissionProduct.PRODUCT_CREATE)]: [
    PermissionProduct.PRODUCT_READER,
    PermissionRecipe.RECIPE_READER,
  ],
  [key(PermissionProduct.PRODUCT_UPDATE)]: [
    PermissionProduct.PRODUCT_READER,
    PermissionRecipe.RECIPE_READER,
  ],
  [key(PermissionProduct.PRODUCT_DELETE)]: [PermissionProduct.PRODUCT_READER],

  // Gastos adicionais
  [key(PermissionAdditionalCost.ADDITIONAL_COST_CREATE)]: [
    PermissionAdditionalCost.ADDITIONAL_COST_READER,
  ],
  [key(PermissionAdditionalCost.ADDITIONAL_COST_UPDATE)]: [
    PermissionAdditionalCost.ADDITIONAL_COST_READER,
  ],
  [key(PermissionAdditionalCost.ADDITIONAL_COST_DELETE)]: [
    PermissionAdditionalCost.ADDITIONAL_COST_READER,
  ],

  // Receitas
  [key(PermissionRecipe.RECIPE_CREATE)]: [PermissionRecipe.RECIPE_READER],
  [key(PermissionRecipe.RECIPE_UPDATE)]: [PermissionRecipe.RECIPE_READER],
  [key(PermissionRecipe.RECIPE_DELETE)]: [PermissionRecipe.RECIPE_READER],

  // Clientes
  [key(PermissionCustomer.CUSTOMER_CREATE)]: [PermissionCustomer.CUSTOMER_READER],
  [key(PermissionCustomer.CUSTOMER_UPDATE)]: [PermissionCustomer.CUSTOMER_READER],
  [key(PermissionCustomer.CUSTOMER_DELETE)]: [PermissionCustomer.CUSTOMER_READER],

  // Produção diária — adicionar itens busca a lista de produtos.
  [key(PermissionDailyProduction.DAILY_PRODUCTION_CREATE)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
  ],
  [key(PermissionDailyProduction.DAILY_PRODUCTION_UPDATE)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
    PermissionProduct.PRODUCT_READER,
  ],
  [key(PermissionDailyProduction.DAILY_PRODUCTION_DELETE)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
  ],
  [key(PermissionDailyProduction.DAILY_PRODUCTION_COMPLETE)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
  ],
  [key(PermissionDailyProduction.DAILY_PRODUCTION_CANCEL)]: [
    PermissionDailyProduction.DAILY_PRODUCTION_READER,
  ],

  // PDV / Caixa — o PDV consulta o caixa aberto antes de vender.
  [key(PermissionSale.SALE_CREATE)]: [PermissionCashRegister.CASH_REGISTER_READER],
  [key(PermissionCashRegister.CASH_REGISTER_OPEN)]: [
    PermissionCashRegister.CASH_REGISTER_READER,
  ],
  [key(PermissionCashRegister.CASH_REGISTER_CLOSE)]: [
    PermissionCashRegister.CASH_REGISTER_READER,
  ],
  [key(PermissionCashRegister.CASH_REGISTER_MOVEMENT_CREATE)]: [
    PermissionCashRegister.CASH_REGISTER_READER,
  ],

  // Estoque / Desperdício — as duas telas listam produtos.
  [key(PermissionStockMovement.STOCK_MOVEMENT_READER)]: [
    PermissionProduct.PRODUCT_READER,
  ],
  [key(PermissionStockMovement.STOCK_MOVEMENT_ADJUST)]: [
    PermissionStockMovement.STOCK_MOVEMENT_READER,
  ],
  // Registrar desperdício é o botão da tela de Desperdício.
  [key(PermissionStockMovement.STOCK_MOVEMENT_WRITE_OFF)]: [
    PermissionStockMovement.STOCK_MOVEMENT_WASTE_READER,
    PermissionProduct.PRODUCT_READER,
  ],

  // Despesas
  [key(PermissionExpense.EXPENSE_CREATE)]: [PermissionExpense.EXPENSE_READER],
  [key(PermissionExpense.EXPENSE_UPDATE)]: [PermissionExpense.EXPENSE_READER],
  [key(PermissionExpense.EXPENSE_DELETE)]: [PermissionExpense.EXPENSE_READER],

  // Usuários
  [key(PermissionUser.USER_CREATE)]: [PermissionUser.USER_READER],
  [key(PermissionUser.USER_UPDATE)]: [PermissionUser.USER_READER],
  [key(PermissionUser.USER_DELETE)]: [PermissionUser.USER_READER],

  // Configurações da empresa
  [key(PermissionCompany.COMPANY_UPDATE)]: [PermissionCompany.COMPANY_READER],

  // Relatórios → tela de origem dos dados
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
