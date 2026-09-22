export type DashboardSummaryOutput = {
  // Ausentes (não zerados) quando o usuário logado não tem a permissão da
  // tela de origem (daily_production.reader / expense.reader / sale.reader)
  // — omitir em vez de devolver 0 evita confundir "sem produção/venda hoje"
  // com "sem acesso a essa tela", e principalmente evita vazar o dado.
  productionCostToday?: number;
  expensesToday?: number;
  salesRevenueCashToday?: number;
  salesRevenuePixToday?: number;
  salesRevenueCardToday?: number;
};
