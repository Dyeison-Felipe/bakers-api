import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export type CashRegisterSessionDetailExpenseOutput = {
  id: string;
  date: Date;
  value: number;
  description: string;
};

export type CashRegisterSessionDetailOutput = {
  id: string;
  status: TypeCashRegisterSessionStatus;
  openingAmount: number;
  openedAt: Date;
  closedAt: Date | null;
  totalCash: number | null;
  totalPix: number | null;
  totalCard: number | null;
  totalSales: number;
  costOfSold: number;
  productionCost: number;
  expenses: CashRegisterSessionDetailExpenseOutput[];
  totalExpenses: number;
  totalWaste: number;
  totalRecoveredAtCost: number;
  totalSupplies: number;
  totalWithdrawals: number;
  profit: number;
};
