import { TypeConsumptionUnit } from '@/shared/infra/enums/product';
import { Product } from '../../domain/entities/product.entity';

export type MaterialUsage = {
  material: Product;
  quantity: number; // quantidade usada, na unidade de consumo da matéria-prima (ex: kg, ml, un)
};

export class ProductRecipeCostCalculator {
  static calculateTotalCost(materials: MaterialUsage[]): number {
    return materials.reduce((total, usage) => {
      return total + this.getCostForUsage(usage);
    }, 0);
  }

  private static getCostForUsage({ material, quantity }: MaterialUsage): number {
    const costPerConsumerUnit = this.getCostPerConsumerUnit(material);

    return costPerConsumerUnit * quantity;
  }

  private static getCostPerConsumerUnit(material: Product): number {
    // UN não tem segundo estágio de conversão — unitCostPrice já é o custo
    // final por unidade de consumo (ex: R$ por ovo).
    if (material.consumerUnit === TypeConsumptionUnit.UN) {
      if (material.unitCostPrice == null) {
        throw new Error(
          `Produto ${material.name} não possui preço unitário definido`,
        );
      }
      return material.unitCostPrice;
    }

    // KG/ML usam o preço por kg/ml, já convertido a partir do peso/volume
    // no cadastro da matéria-prima (ex: R$4,83/kg, não R$120,67/saco).
    if (material.pricePerKilogram == null) {
      throw new Error(
        `Produto ${material.name} não possui preço por quilograma/mililitro definido`,
      );
    }

    return material.pricePerKilogram;
  }
}