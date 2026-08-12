export type ExpenseReportItem = {
  id: string;
  date: Date;
  value: number;
  description: string;
};

export type ExpenseReportDailyPoint = {
  day: string;
  total: number;
};

export type ExpenseReportOutput = {
  total: number;
  dailySeries: ExpenseReportDailyPoint[];
  items: ExpenseReportItem[];
};
