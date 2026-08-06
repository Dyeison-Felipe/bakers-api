export type DiscardBatchLeftoverOutput = {
  id: string;
  discardedQuantity: number;
  soldAtCost: boolean;
  lossValue: number | null;
  recoveredValue: number | null;
};
