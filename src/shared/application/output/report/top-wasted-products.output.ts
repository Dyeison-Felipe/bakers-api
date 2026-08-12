export type TopWastedProductPoint = {
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
};

export type TopWastedProductsOutput = TopWastedProductPoint[];
