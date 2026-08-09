import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Category } from '@/core/category/domain/entities/category.entity';
import { Product } from '../../domain/entities/product.entity';
import { ProductRecipeItem } from '../../domain/entities/product-recipe-item.entity';
import { ProductAdditionalCost } from '../../domain/entities/product-additional-cost.entity';
import { ProductRecipeLink } from '../../domain/entities/product-recipe-link.entity';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { RecipeItem } from '@/core/recipe/domain/entities/recipe-item.entity';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';

export const makeCompany = (overrides: Record<string, unknown> = {}): Company => {
  const company = { id: 'company-1', ...overrides };
  Object.setPrototypeOf(company, Company.prototype);
  return company as Company;
};

export const makeLoggedUser = (
  overrides: Partial<{ id: string; company: Company }> = {},
): UserEntity => {
  return {
    id: overrides.id ?? 'user-1',
    company: overrides.company ?? makeCompany(),
  } as unknown as UserEntity;
};

export const makeCategory = (overrides: Record<string, unknown> = {}): Category => {
  const category = {
    id: 'category-1',
    name: 'Pães',
    company: makeCompany(),
    parent: null as { id: string; name: string } | null,
    children: [] as Category[],
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ...overrides,
  };
  Object.setPrototypeOf(category, Category.prototype);
  return category as unknown as Category;
};

export const makeProduct = (overrides: Record<string, unknown> = {}): Product => {
  const product = {
    id: 'product-1',
    name: 'Pão Francês',
    scaleReference: null as string | null,
    barCode: null as string | null,
    ncm: '19059090',
    costPrice: 10,
    unitCostPrice: 0.5,
    pricePerKilogram: 8 as number | null,
    salePrice: 1 as number | null,
    profitPrice: 0.5 as number | null,
    unitOfMeasurement: TypeUnitOfMeasurement.UN as TypeUnitOfMeasurement | null,
    consumerUnit: null as TypeConsumptionUnit | null,
    expirationDateInDays: '3' as string | null,
    stockManagement: true,
    typeProduct: TypeProduct.OWN_PRODUCTION,
    currentStock: 50 as number | null,
    stockMin: 10 as number | null,
    active: true,
    description: null as string | null,
    purchaseUnit: null,
    quantity: 100 as number | null,
    weight: 10 as number | null,
    volume: null as number | null,
    imagePath: null as string | null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    company: makeCompany(),
    category: makeCategory(),
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    update(props: Record<string, unknown>) {
      Object.assign(this, props);
    },
    updateStock(props: { currentStock: number; updatedBy: string }) {
      this.currentStock = props.currentStock;
      this.updatedBy = props.updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(product, Product.prototype);
  return product as unknown as Product;
};

export const makeAdditionalCost = (
  overrides: Record<string, unknown> = {},
): AdditionalCost => {
  const additionalCost = {
    id: 'additional-cost-1',
    name: 'Embalagem',
    company: makeCompany(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    ...overrides,
  };
  Object.setPrototypeOf(additionalCost, AdditionalCost.prototype);
  return additionalCost as unknown as AdditionalCost;
};

export const makeRecipe = (overrides: Record<string, unknown> = {}): Recipe => {
  const recipe = {
    id: 'recipe-1',
    name: 'Massa base',
    company: makeCompany(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    ...overrides,
  };
  Object.setPrototypeOf(recipe, Recipe.prototype);
  return recipe as unknown as Recipe;
};

export const makeRecipeItem = (overrides: Record<string, unknown> = {}): RecipeItem => {
  const recipeItem = {
    id: 'recipe-item-1',
    recipe: makeRecipe(),
    material: makeProduct({
      id: 'material-1',
      name: 'Farinha',
      consumerUnit: TypeConsumptionUnit.KG,
      pricePerKilogram: 4,
      unitCostPrice: 4,
    }),
    quantity: 1,
    ...overrides,
  };
  Object.setPrototypeOf(recipeItem, RecipeItem.prototype);
  return recipeItem as unknown as RecipeItem;
};

export const makeProductRecipeItem = (
  overrides: Record<string, unknown> = {},
): ProductRecipeItem => {
  const item = {
    id: 'product-recipe-item-1',
    product: makeProduct(),
    material: makeProduct({
      id: 'material-1',
      name: 'Farinha',
      consumerUnit: TypeConsumptionUnit.KG,
      pricePerKilogram: 4,
      unitCostPrice: 4,
    }),
    quantity: 1,
    updateQuantity(quantity: number) {
      this.quantity = quantity;
    },
    ...overrides,
  };
  Object.setPrototypeOf(item, ProductRecipeItem.prototype);
  return item as unknown as ProductRecipeItem;
};

export const makeProductAdditionalCost = (
  overrides: Record<string, unknown> = {},
): ProductAdditionalCost => {
  const item = {
    id: 'product-additional-cost-1',
    product: makeProduct(),
    additionalCost: makeAdditionalCost(),
    value: 2,
    updateValue(value: number) {
      this.value = value;
    },
    ...overrides,
  };
  Object.setPrototypeOf(item, ProductAdditionalCost.prototype);
  return item as unknown as ProductAdditionalCost;
};

export const makeProductRecipeLink = (
  overrides: Record<string, unknown> = {},
): ProductRecipeLink => {
  const link = {
    id: 'product-recipe-link-1',
    product: makeProduct(),
    recipe: makeRecipe(),
    ...overrides,
  };
  Object.setPrototypeOf(link, ProductRecipeLink.prototype);
  return link as unknown as ProductRecipeLink;
};

export const makePagination = <T>(items: T[]) => ({
  items,
  meta: {
    totalItems: items.length,
    itemCount: items.length,
    itemsPerPage: 10,
    totalPages: 1,
    currentPage: 1,
  },
});
