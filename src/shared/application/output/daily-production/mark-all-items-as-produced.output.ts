export type MarkAllItemsAsProducedFailure = {
  itemId: string;
  productName: string;
  reason: string;
};

export type MarkAllItemsAsProducedOutput = {
  itemIds: string[];
  failures: MarkAllItemsAsProducedFailure[];
};
