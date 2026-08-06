export type RecipeOutput = {
  id: string;
  name?: string;
};

export type RecipeItemOutput = {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    imagePath: string | null;
    consumerUnit: string | null;
    unitCostPrice: number;
    pricePerKilogram: number | null;
  };
};

export type RecipeDetailOutput = {
  id: string;
  name: string;
  costPrice: number;
  items: RecipeItemOutput[];
};
