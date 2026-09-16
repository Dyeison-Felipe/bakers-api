export type ContributionMarginReportItem = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  variableCost: number;
  contributionMargin: number;
  contributionMarginPercent: number;
};

export type ContributionMarginReportOutput = {
  totalRevenue: number;
  totalVariableCost: number;
  totalContributionMargin: number;
  items: ContributionMarginReportItem[];
};
