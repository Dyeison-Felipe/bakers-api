import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class ProductProfitCalculator {
  static getPricingBasis(
    unitOfMeasurement: TypeUnitOfMeasurement | null,
    unitCostPrice: number | null,
    pricePerKilogram: number | null,
  ): number | null {
    return unitOfMeasurement === TypeUnitOfMeasurement.KG
      ? pricePerKilogram
      : unitCostPrice;
  }

  static calculateProfit(salePrice: number, basis: number | null): number | null {
    if (!basis || basis <= 0) return null;

    const profit = salePrice - basis;

    return Math.max(profit, 0);
  }
}