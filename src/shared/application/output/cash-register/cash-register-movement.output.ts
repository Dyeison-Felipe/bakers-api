import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';

export type CashRegisterMovementOutput = {
  id: string;
  type: TypeCashRegisterMovement;
  reason: TypeCashRegisterMovementReason;
  description: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
};
