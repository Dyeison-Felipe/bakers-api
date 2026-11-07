export enum TypeStockMovement {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export enum TypeStockMovementReason {
  PRODUCTION = 'PRODUCTION',
  SALE = 'SALE',
  WASTE = 'WASTE',
  LEFTOVER_SOLD_AT_COST = 'LEFTOVER_SOLD_AT_COST',
  // Entrada/baixa lançada à mão na tela de Estoque (inventário, compra,
  // correção de saldo).
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

// Em qual unidade a quantidade de uma movimentação manual foi digitada.
// O estoque de matéria-prima é guardado na unidade de CONSUMO (kg/ml/un, a
// mesma da receita), mas quem dá entrada pensa na embalagem comprada.
export enum TypeStockInputUnit {
  // Já na unidade do estoque (kg/ml/un de consumo; un/kg/cento de venda).
  STOCK = 'STOCK',
  // 1 item da embalagem (ex.: 1 lata) — convertido pelo peso/volume por unidade.
  ITEM = 'ITEM',
  // 1 embalagem de compra (ex.: 1 pacote com 6 latas).
  PURCHASE = 'PURCHASE',
}
