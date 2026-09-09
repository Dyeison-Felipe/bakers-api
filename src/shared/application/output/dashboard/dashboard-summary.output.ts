export type DashboardSummaryOutput = {
  productionCostToday: number;
  expensesToday: number;
  // Ausentes (não zerados) quando o plano da empresa não inclui PDV/Caixa —
  // omitir em vez de devolver 0 evita confundir "sem venda hoje" com
  // "módulo não contratado".
  salesRevenueCashToday?: number;
  salesRevenuePixToday?: number;
  salesRevenueCardToday?: number;
};
