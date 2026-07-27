import {
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';

type PurchaseGroup = 'count' | 'weight' | 'volume' | null;

function getPurchaseGroup(purchaseUnit: TypeUnitOfPurchase | null): PurchaseGroup {
  switch (purchaseUnit) {
    case TypeUnitOfPurchase.UN:
    case TypeUnitOfPurchase.CX:
      return 'count';
    case TypeUnitOfPurchase.KG:
    case TypeUnitOfPurchase.FD:
    case TypeUnitOfPurchase.PCT:
    case TypeUnitOfPurchase.SC:
      return 'weight';
    case TypeUnitOfPurchase.ML:
      return 'volume';
    default:
      return null;
  }
}

/**
 * Custo que serve de BASE para calcular margem de lucro, de acordo com a
 * unidade de venda escolhida em relação à unidade de compra.
 * Espelha exatamente a lógica de getSaleBasisCost do frontend (utils/product.ts).
 */
export function getSaleBasisCost({
  purchaseUnit,
  unitOfMeasurement,
  costPrice,
  quantity,
  weight,
  volume,
}: {
  purchaseUnit: TypeUnitOfPurchase | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  costPrice: number;
  quantity: number | null;
  weight: number | null;
  volume: number | null;
}): number {
  const group = getPurchaseGroup(purchaseUnit);
  // Sem purchaseUnit (produção própria): o costPrice já É o custo unitário
  if (!group || !unitOfMeasurement) return costPrice;

  if (group === 'count') {
    if (unitOfMeasurement === TypeUnitOfMeasurement.CX) return costPrice;
    return quantity && quantity > 0 ? costPrice / quantity : costPrice;
  }

  if (group === 'weight') {
    if (unitOfMeasurement === TypeUnitOfMeasurement.KG) {
      return weight && weight > 0 ? costPrice / weight : costPrice;
    }
    return costPrice;
  }

  if (group === 'volume') {
    if (unitOfMeasurement === TypeUnitOfMeasurement.L) {
      return volume && volume > 0 ? costPrice / volume : costPrice;
    }
    return costPrice;
  }

  return costPrice;
}