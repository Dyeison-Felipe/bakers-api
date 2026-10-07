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
