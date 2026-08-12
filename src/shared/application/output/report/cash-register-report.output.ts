import { CashRegisterSessionDetailOutput } from '../cash-register/cash-register-session-detail.output';

export type CashRegisterReportSummary = {
  sessionsCount: number;
  totalOpeningAmount: number;
  totalSales: number;
  costOfSold: number;
  totalProductionCost: number;
  totalExpenses: number;
  totalWaste: number;
  totalRecoveredAtCost: number;
  totalSupplies: number;
  totalWithdrawals: number;
  totalProfit: number;
};

export type CashRegisterReportOutput = {
  summary: CashRegisterReportSummary;
  sessions: CashRegisterSessionDetailOutput[];
};
