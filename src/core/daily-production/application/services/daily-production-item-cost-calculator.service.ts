import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type CostCalculationInput = {
  unitOfMeasurement: TypeUnitOfMeasurement;
  plannedQuantity: number | null;
  recipeMultiplier: number | null;
  productWeight: number | null;
  unitCostPrice: number;
  pricePerKilogram: number | null;
};

export type CostCalculationResult = {
  plannedWeight: number | null;
  plannedCost: number;
};

export class DailyProductionItemCostCalculator {
  static calculate(input: CostCalculationInput): CostCalculationResult {
    if (input.unitOfMeasurement === TypeUnitOfMeasurement.KG) {
      return this.calculateForWeightBasedProduct(input);
    }

    return this.calculateForUnitBasedProduct(input);
  }

  private static calculateForWeightBasedProduct(
    input: CostCalculationInput,
  ): CostCalculationResult {
    if (!input.productWeight || input.productWeight <= 0) {
      throw new BadRequestError(
        'Produto sem peso de receita cadastrado (campo "peso" do produto)',
      );
    }

    if (!input.recipeMultiplier || input.recipeMultiplier <= 0) {
      throw new BadRequestError(
        'Informe o multiplicador de receita (ex: 1, 0.5, 2)',
      );
    }

    if (!input.pricePerKilogram || input.pricePerKilogram <= 0) {
      throw new BadRequestError(
        'Produto sem preço de custo por quilo calculado',
      );
    }

    const plannedWeight = input.recipeMultiplier * input.productWeight;
    const plannedCost = input.pricePerKilogram * plannedWeight;

    return { plannedWeight, plannedCost };
  }

  private static calculateForUnitBasedProduct(
    input: CostCalculationInput,
  ): CostCalculationResult {
    if (!input.plannedQuantity || input.plannedQuantity <= 0) {
      throw new BadRequestError('Informe a quantidade a ser produzida');
    }

    if (!input.unitCostPrice || input.unitCostPrice <= 0) {
      throw new BadRequestError('Produto sem preço de custo unitário calculado');
    }

    const plannedCost = input.unitCostPrice * input.plannedQuantity;

    return { plannedWeight: null, plannedCost };
  }
}
