import { Expense } from '@/core/expense/domain/entities/expense.entity';
import { CashRegisterSession } from '../../domain/entities/cash-register-session.entity';
import { CashRegisterSessionDetailOutput } from '@/shared/application/output/cash-register/cash-register-session-detail.output';

type Input = {
  session: CashRegisterSession;
  totalRevenue: number;
  costOfSold: number;
  // Soma bruta (sem arredondar) do custo planejado dos itens PRODUZIDOS na
  // janela de dias da sessão.
  productionCostRaw: number;
  expenses: Expense[];
  totalWaste: number;
  totalRecoveredAtCost: number;
  totalSupplies: number;
  totalWithdrawals: number;
};

export const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Única fonte da fórmula do detalhe de uma sessão de caixa. Usada tanto pelo
 * detalhe individual (`FindCashRegisterSessionDetailUseCase`) quanto pelo
 * relatório por período (`FindCashRegisterReportUseCase`), para que os dois
 * nunca divirjam nos números.
 */
export const buildCashRegisterSessionDetail = ({
  session,
  totalRevenue,
  costOfSold,
  productionCostRaw,
  expenses,
  totalWaste,
  totalRecoveredAtCost,
  totalSupplies,
  totalWithdrawals,
}: Input): CashRegisterSessionDetailOutput => {
  const productionCost = round2(productionCostRaw);

  const totalExpenses = round2(
    expenses.reduce((sum, expense) => sum + expense.value, 0),
  );

  // Lucro real = vendas (+ o que foi recuperado vendendo sobra ao custo,
  // já que isso não é perda) − custo do que foi efetivamente produzido −
  // valor perdido em descarte − despesas do dia.
  const profit = round2(
    totalRevenue +
      totalRecoveredAtCost -
      productionCost -
      totalWaste -
      totalExpenses,
  );

  return {
    id: session.id,
    status: session.status,
    openingAmount: session.openingAmount,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    totalCash: session.totalCash,
    totalPix: session.totalPix,
    totalCard: session.totalCard,
    totalSales: round2(totalRevenue),
    costOfSold: round2(costOfSold),
    productionCost,
    expenses: expenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      value: expense.value,
      description: expense.description,
    })),
    totalExpenses,
    totalWaste: round2(totalWaste),
    totalRecoveredAtCost: round2(totalRecoveredAtCost),
    totalSupplies: round2(totalSupplies),
    totalWithdrawals: round2(totalWithdrawals),
    profit,
  };
};
