import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';

export const OWN_PRODUCTION_CT_QUANTITY = 100;

export type UnitCostCalculatorInput = {
  typeProduct: TypeProduct;
  costPrice: number;
  quantity: number | null;
  weight: number | null;
  volume: number | null;
  consumerUnit: TypeConsumptionUnit | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
};

export type UnitCostCalculatorResult = {
  unitCostPrice: number | null;
  pricePerKilogram: number | null;
};

export class ProductUnitCostCalculator {
  static calculate(input: UnitCostCalculatorInput): UnitCostCalculatorResult {
    if (input.typeProduct === TypeProduct.RAW_MATERIAL) {
      return this.calculateForRawMaterial(input);
    }

    if (input.typeProduct === TypeProduct.OWN_PRODUCTION) {
      return this.calculateForOwnProduction(input);
    }

    return { unitCostPrice: null, pricePerKilogram: null };
  }

  private static calculateForRawMaterial(
    input: UnitCostCalculatorInput,
  ): UnitCostCalculatorResult {
    const costDivisor = this.positiveOrNull(input.quantity);

    if (!costDivisor) {
      return { unitCostPrice: null, pricePerKilogram: null };
    }

    const unitCostPrice = input.costPrice / costDivisor;

    const consumerDivisor = this.getConsumerUnitDivisor(
      input.consumerUnit,
      input.weight,
      input.volume,
    );

    const pricePerKilogram = consumerDivisor
      ? unitCostPrice / consumerDivisor
      : null;

    return { unitCostPrice, pricePerKilogram };
  }

  private static calculateForOwnProduction(
    input: UnitCostCalculatorInput,
  ): UnitCostCalculatorResult {
    // CT trava a quantidade em 100, mesma regra do front — não confia no valor
    // que vier do client pra esse caso
    const quantity =
      input.unitOfMeasurement === TypeUnitOfMeasurement.CT
        ? OWN_PRODUCTION_CT_QUANTITY
        : input.quantity;

    const costDivisor = this.positiveOrNull(quantity);
    const weightDivisor = this.positiveOrNull(input.weight);

    const unitCostPrice = costDivisor ? input.costPrice / costDivisor : null;
    const pricePerKilogram = weightDivisor
      ? input.costPrice / weightDivisor
      : null;

    return { unitCostPrice, pricePerKilogram };
  }

  private static getConsumerUnitDivisor(
    consumerUnit: TypeConsumptionUnit | null,
    weight: number | null,
    volume: number | null,
  ): number | null {
    switch (consumerUnit) {
      case TypeConsumptionUnit.KG:
        return this.positiveOrNull(weight);
      case TypeConsumptionUnit.ML:
        return this.positiveOrNull(volume);
      default:
        return null;
    }
  }

  private static positiveOrNull(value: number | null): number | null {
    return value && value > 0 ? value : null;
  }
}