export type DailyRevenueSeriesPoint = {
  day: string;
  cash: number;
  pix: number;
  card: number;
  total: number;
};

export type DailyRevenueSeriesOutput = DailyRevenueSeriesPoint[];
