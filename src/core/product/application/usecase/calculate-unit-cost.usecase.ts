import { UseCase } from '@/shared/application/usecase/usecase';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';
import { ProductUnitCostCalculator } from '../services/product-unit-cost-calculator.service';

type Input = {
  typeProduct: TypeProduct;
  costPrice: number;
  quantity?: number;
  weight?: number;
  volume?: number;
  consumerUnit?: TypeConsumptionUnit;
  unitOfMeasurement?: TypeUnitOfMeasurement;
};

type Output = {
  unitCostPrice: number | null;
  pricePerKilogram: number | null;
};

export class CalculateUnitCostUseCase implements UseCase<Input, Output> {
  execute(input: Input): Output {
    return ProductUnitCostCalculator.calculate({
      typeProduct: input.typeProduct,
      costPrice: input.costPrice,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      consumerUnit: input.consumerUnit ?? null,
      unitOfMeasurement: input.unitOfMeasurement ?? null,
    });
  }
}