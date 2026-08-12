export type CostComparisonSeriesPoint = {
  day: string;
  productionCost: number;
  expenses: number;
  waste: number;
};

export type CostComparisonSeriesOutput = CostComparisonSeriesPoint[];
