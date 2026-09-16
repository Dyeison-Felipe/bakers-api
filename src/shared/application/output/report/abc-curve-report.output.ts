export type AbcCurveClassification = 'A' | 'B' | 'C';

export type AbcCurveReportItem = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  revenuePercent: number;
  cumulativePercent: number;
  classification: AbcCurveClassification;
};

export type AbcCurveReportOutput = {
  totalRevenue: number;
  items: AbcCurveReportItem[];
};
