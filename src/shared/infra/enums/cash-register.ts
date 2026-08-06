export enum TypeCashRegisterSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum TypeCashRegisterMovement {
  WITHDRAWAL = 'WITHDRAWAL',
  SUPPLY = 'SUPPLY',
}

export enum TypeCashRegisterMovementReason {
  EXPENSE_PAYMENT = 'EXPENSE_PAYMENT',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  OWNER_REINFORCEMENT = 'OWNER_REINFORCEMENT',
  OTHER = 'OTHER',
}
