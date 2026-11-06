import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { CashRegisterMovementOutput } from './cash-register-movement.output';

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

/**
 * Saída do detalhe individual do caixa (Histórico de Caixa). Estende o
 * detalhe base (compartilhado com o relatório por período) com o valor
 * vendido em cada forma de pagamento — calculado direto das vendas, então
 * funciona também com o caixa ainda aberto e não mistura sangria/incremento —
 * e a lista de cada sangria/incremento da sessão.
 */
export type FindCashRegisterSessionDetailOutput = CashRegisterSessionDetailOutput & {
  salesCash: number;
  salesPix: number;
  salesCard: number;
  movements: CashRegisterMovementOutput[];
};
