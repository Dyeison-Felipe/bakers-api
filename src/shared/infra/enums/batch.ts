// Mantido só para compatibilidade de compilação de migrations históricas
// (ex: 1786100000001-create-table-batch-movement.ts) — o módulo `batch` em
// si foi removido, substituído por `core/stock-movement`
// (`@/shared/infra/enums/stock-movement`). Não usar em código novo.
export enum TypeBatchMovement {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export enum TypeBatchMovementReason {
  PRODUCTION = 'PRODUCTION',
  MANUAL_DISCARD = 'MANUAL_DISCARD',
  MANUAL_CONSUMPTION = 'MANUAL_CONSUMPTION',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  CORRECTION = 'CORRECTION',
  DELETION = 'DELETION',
  SALE = 'SALE',
  WASTE = 'WASTE',
  LEFTOVER_SOLD_AT_COST = 'LEFTOVER_SOLD_AT_COST',
}
