import {
  validatePermissionDependencies,
  PERMISSION_DEPENDENCIES,
  permissionKey,
} from '../permission-dependencies';
import { Permissions } from '../permissions';
import { PermissionCategory } from '../category';
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
        PermissionCategory.CATEGORY_READER,
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
    [PermissionStockMovement.STOCK_MOVEMENT_ADJUST, PermissionStockMovement.STOCK_MOVEMENT_READER],
  ])('%o requires %o', (dependent, required) => {
    expect(() => validatePermissionDependencies([dependent])).toThrow();
    // stock_movement.reader puxa product.reader → category.reader.
    const transitive =
      required === PermissionStockMovement.STOCK_MOVEMENT_READER
        ? [PermissionProduct.PRODUCT_READER, PermissionCategory.CATEGORY_READER]
        : [];
    expect(() =>
      validatePermissionDependencies([dependent, required, ...transitive]),
    ).not.toThrow();
  });

  it.each([
    [PermissionDailyProduction.DAILY_PRODUCTION_COMPLETE, [PermissionDailyProduction.DAILY_PRODUCTION_READER]],
    [PermissionDailyProduction.DAILY_PRODUCTION_CANCEL, [PermissionDailyProduction.DAILY_PRODUCTION_READER]],
    [
      PermissionDailyProduction.DAILY_PRODUCTION_UPDATE,
      [PermissionDailyProduction.DAILY_PRODUCTION_READER, PermissionProduct.PRODUCT_READER],
    ],
    [PermissionCashRegister.CASH_REGISTER_OPEN, [PermissionCashRegister.CASH_REGISTER_READER]],
    [PermissionSale.SALE_CREATE, [PermissionCashRegister.CASH_REGISTER_READER]],
    [PermissionStockMovement.STOCK_MOVEMENT_READER, [PermissionProduct.PRODUCT_READER]],
    [PermissionProduct.PRODUCT_READER, [PermissionCategory.CATEGORY_READER]],
    [PermissionExpense.EXPENSE_CREATE, [PermissionExpense.EXPENSE_READER]],
  ])('%o requires %o', (dependent, required) => {
    expect(() => validatePermissionDependencies([dependent])).toThrow();
    expect(() =>
      // category.reader entra sempre: é o fim da cadeia transitiva
      // (… → product.reader → category.reader).
      validatePermissionDependencies([
        dependent,
        ...required,
        PermissionCategory.CATEGORY_READER,
      ]),
    ).not.toThrow();
  });

  it('should report every missing dependency, not just the first one', () => {
    expect(() =>
      validatePermissionDependencies([PermissionStockMovement.STOCK_MOVEMENT_WRITE_OFF]),
    ).toThrow(/stock_movement\.waste_reader, product\.reader/);
  });

  it('should only reference permissions that exist', () => {
    const all = new Set(Object.values(Permissions).map(permissionKey));
    for (const [dependent, required] of Object.entries(PERMISSION_DEPENDENCIES)) {
      expect(all.has(dependent)).toBe(true);
      for (const ref of required) expect(all.has(permissionKey(ref))).toBe(true);
    }
  });

  it('should accept a full permission set (Admin gets everything)', () => {
    expect(() =>
      validatePermissionDependencies(Object.values(Permissions)),
    ).not.toThrow();
  });

  it('should ignore permissions that are not part of the dependency map', () => {
    expect(() =>
      validatePermissionDependencies([
        PermissionCategory.CATEGORY_READER,
        PermissionSale.SALE_READER,
      ]),
    ).not.toThrow();
  });
});
