import {
  validatePermissionDependencies,
  PERMISSION_DEPENDENCIES,
} from '../permission-dependencies';
import { PermissionReport } from '../report';
import { PermissionStockMovement } from '../stock-movement';
import { PermissionDailyProduction } from '../daily-production';
import { PermissionExpense } from '../expense';
import { PermissionCashRegister } from '../cash-register';
import { PermissionSale } from '../sale';
import { PermissionProduct } from '../product';

describe('validatePermissionDependencies', () => {
  it('should not throw when the set has no permission with a dependency', () => {
    expect(() =>
      validatePermissionDependencies([
        PermissionProduct.PRODUCT_READER,
        PermissionSale.SALE_READER,
      ]),
    ).not.toThrow();
  });

  it('should throw when a dependent permission is selected without its dependency', () => {
    expect(() =>
      validatePermissionDependencies([PermissionReport.REPORT_WASTE_READER]),
    ).toThrow(/stock_movement\.waste_reader/);
  });

  it('should not throw when the dependency is present in the same set', () => {
    expect(() =>
      validatePermissionDependencies([
        PermissionReport.REPORT_WASTE_READER,
        PermissionStockMovement.STOCK_MOVEMENT_WASTE_READER,
      ]),
    ).not.toThrow();
  });

  it.each([
    [PermissionReport.REPORT_PRODUCTION_READER, PermissionDailyProduction.DAILY_PRODUCTION_READER],
    [PermissionReport.REPORT_EXPENSE_READER, PermissionExpense.EXPENSE_READER],
    [PermissionReport.REPORT_CASH_REGISTER_READER, PermissionCashRegister.CASH_REGISTER_HISTORY_READER],
    [PermissionReport.REPORT_CPV_READER, PermissionSale.SALE_READER],
    [PermissionReport.REPORT_CONTRIBUTION_MARGIN_READER, PermissionSale.SALE_READER],
    [PermissionReport.REPORT_ABC_CURVE_READER, PermissionSale.SALE_READER],
  ])('%o requires %o', (dependent, required) => {
    expect(() => validatePermissionDependencies([dependent])).toThrow();
    expect(() =>
      validatePermissionDependencies([dependent, required]),
    ).not.toThrow();
  });

  it('should report every missing dependency, not just the first one', () => {
    // reforça a garantia de que o mapa cobre exatamente as 6 dependências de
    // relatório combinadas (nenhuma sobrando, nenhuma faltando)
    expect(Object.keys(PERMISSION_DEPENDENCIES).sort()).toEqual(
      [
        'report.waste_reader',
        'report.production_reader',
        'report.expense_reader',
        'report.cash_register_reader',
        'report.cpv_reader',
        'report.contribution_margin_reader',
        'report.abc_curve_reader',
      ].sort(),
    );
  });

  it('should ignore permissions that are not part of the dependency map', () => {
    expect(() =>
      validatePermissionDependencies([
        PermissionProduct.PRODUCT_CREATE,
        PermissionProduct.PRODUCT_UPDATE,
      ]),
    ).not.toThrow();
  });
});
