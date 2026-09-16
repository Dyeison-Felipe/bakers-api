export type CpvReportItem = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cpv: number;
  grossProfit: number;
};

export type CpvReportOutput = {
  totalRevenue: number;
  totalCpv: number;
  grossProfit: number;
  items: CpvReportItem[];
};
