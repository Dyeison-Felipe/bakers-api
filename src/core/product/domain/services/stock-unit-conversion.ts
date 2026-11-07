import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { TypeStockInputUnit } from '@/shared/infra/enums/stock-movement';
import type { Product } from '../entities/product.entity';

type ConvertibleProduct = Pick<
  Product,
  | 'name'
  | 'typeProduct'
  | 'consumerUnit'
  | 'purchaseUnit'
  | 'quantity'
  | 'weight'
  | 'volume'
>;

const PURCHASE_UNIT_LABELS: Record<TypeUnitOfPurchase, string> = {
  [TypeUnitOfPurchase.UN]: 'unidade(s)',
  [TypeUnitOfPurchase.CX]: 'caixa(s)',
  [TypeUnitOfPurchase.PCT]: 'pacote(s)',
  [TypeUnitOfPurchase.FD]: 'fardo(s)',
  [TypeUnitOfPurchase.SC]: 'saco(s)',
};

const round3 = (value: number) => Math.round(value * 1000) / 1000;

const isRawMaterialLike = (product: ConvertibleProduct) =>
  product.typeProduct === TypeProduct.RAW_MATERIAL ||
  product.typeProduct === TypeProduct.RAW_MATERIAL_AND_RESALE;

/** Quanto 1 item da embalagem (ex.: 1 lata) vale na unidade de consumo. */
const itemToConsumption = (product: ConvertibleProduct): number => {
  switch (product.consumerUnit) {
    case TypeConsumptionUnit.KG:
      if (!product.weight || product.weight <= 0) {
        throw new BadRequestError(
          `Cadastre o peso por unidade de ${product.name} para lançar o estoque em unidades`,
        );
      }
      return product.weight;
    case TypeConsumptionUnit.ML:
      if (!product.volume || product.volume <= 0) {
        throw new BadRequestError(
          `Cadastre o volume por unidade de ${product.name} para lançar o estoque em unidades`,
        );
      }
      return product.volume;
    default:
      return 1;
  }
};

/** Itens por embalagem de compra ("Quantidade comprada" do cadastro). */
const itemsPerPurchase = (product: ConvertibleProduct): number =>
  product.quantity && product.quantity > 0 ? product.quantity : 1;

/**
 * Converte a quantidade digitada (em `unit`) para a unidade em que o estoque
 * do produto é guardado. Matéria-prima guarda na unidade de consumo (a da
 * receita), então 20 latas de 200 g viram 4 kg; um pacote com 6 latas de
 * 200 g vira 1,2 kg. Produtos de venda (produção própria/revenda) só aceitam
 * a unidade do estoque.
 */
export const convertToStockQuantity = (
  product: ConvertibleProduct,
  quantity: number,
  unit: TypeStockInputUnit = TypeStockInputUnit.STOCK,
): number => {
  if (unit === TypeStockInputUnit.STOCK) return quantity;

  if (!isRawMaterialLike(product)) {
    throw new BadRequestError(
      `${product.name} só pode ser movimentado na própria unidade de estoque`,
    );
  }

  const factor =
    unit === TypeStockInputUnit.PURCHASE
      ? itemToConsumption(product) * itemsPerPurchase(product)
      : itemToConsumption(product);

  return round3(quantity * factor);
};

/** Texto curto do que foi digitado (ex.: "20 unidade(s)", "3 pacote(s) de 6
 * un") — registrado na observação da movimentação, já que o histórico
 * mostra a quantidade convertida. Null quando já está na unidade do estoque. */
export const describeStockInput = (
  product: ConvertibleProduct,
  quantity: number,
  unit: TypeStockInputUnit = TypeStockInputUnit.STOCK,
): string | null => {
  if (unit === TypeStockInputUnit.ITEM) return `${quantity} unidade(s)`;
  if (unit === TypeStockInputUnit.PURCHASE) {
    const label = product.purchaseUnit
      ? PURCHASE_UNIT_LABELS[product.purchaseUnit]
      : 'embalagem(ns)';
    return `${quantity} ${label} de ${itemsPerPurchase(product)} un`;
  }
  return null;
};
