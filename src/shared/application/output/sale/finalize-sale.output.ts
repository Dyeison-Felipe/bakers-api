export type FinalizeSaleOutput = {
  id: string;
  totalAmount: number;
  amountReceived: number | null;
  changeAmount: number | null;
  receiptPdfUrl?: string;
};
