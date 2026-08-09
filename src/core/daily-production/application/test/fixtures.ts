import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Product } from '@/core/product/domain/entities/product.entity';
import { DailyProduction } from '../../domain/entities/daily-production.entity';
import { DailyProductionItem } from '../../domain/entities/daily-production-item.entity';
import { TypeDailyProductionStatus, TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement, TypeProduct } from '@/shared/infra/enums/product';

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

export const makeProduct = (overrides: Record<string, unknown> = {}): Product => {
  const product = {
    id: 'product-1',
    name: 'Pão Francês',
    typeProduct: TypeProduct.OWN_PRODUCTION,
    unitOfMeasurement: TypeUnitOfMeasurement.UN,
    stockManagement: true,
    weight: 10,
    quantity: 100,
    unitCostPrice: 0.5,
    pricePerKilogram: 8,
    ...overrides,
  };
  Object.setPrototypeOf(product, Product.prototype);
  return product as unknown as Product;
};

export const makeDailyProduction = (
  overrides: Record<string, unknown> = {},
): DailyProduction => {
  const dailyProduction = {
    id: 'daily-production-1',
    company: makeCompany(),
    productionDate: new Date('2026-08-09T00:00:00Z'),
    status: TypeDailyProductionStatus.OPEN,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    complete(updatedBy: string) {
      this.status = TypeDailyProductionStatus.COMPLETED;
      this.updatedBy = updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(dailyProduction, DailyProduction.prototype);
  return dailyProduction as unknown as DailyProduction;
};

export const makeItem = (overrides: Record<string, unknown> = {}): DailyProductionItem => {
  const item = {
    id: 'item-1',
    dailyProduction: makeDailyProduction(),
    product: makeProduct(),
    unitOfMeasurement: TypeUnitOfMeasurement.UN,
    plannedQuantity: 10 as number | null,
    recipeMultiplier: null as number | null,
    plannedWeight: null as number | null,
    unitCostPriceSnapshot: 0.5 as number | null,
    pricePerKilogramSnapshot: null as number | null,
    plannedCost: 5,
    status: TypeDailyProductionItemStatus.PLANNED,
    actualQuantity: null as number | null,
    actualWeight: null as number | null,
    producedAt: null as Date | null,
    producedBy: null as string | null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    markAsProduced(props: { actualQuantity: number | null; actualWeight: number | null; producedBy: string }) {
      this.status = TypeDailyProductionItemStatus.PRODUCED;
      this.actualQuantity = props.actualQuantity;
      this.actualWeight = props.actualWeight;
      this.producedAt = new Date();
      this.producedBy = props.producedBy;
      this.updatedBy = props.producedBy;
    },
    updatePlanned(props: { plannedQuantity: number | null; recipeMultiplier: number | null; plannedWeight: number | null; plannedCost: number; updatedBy: string }) {
      this.plannedQuantity = props.plannedQuantity;
      this.recipeMultiplier = props.recipeMultiplier;
      this.plannedWeight = props.plannedWeight;
      this.plannedCost = props.plannedCost;
      this.updatedBy = props.updatedBy;
    },
    cancel(updatedBy: string) {
      this.status = TypeDailyProductionItemStatus.CANCELLED;
      this.updatedBy = updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(item, DailyProductionItem.prototype);
  return item as unknown as DailyProductionItem;
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
