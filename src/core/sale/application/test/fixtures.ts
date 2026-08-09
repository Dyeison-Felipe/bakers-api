import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import { Product } from '@/core/product/domain/entities/product.entity';
import { Sale } from '../../domain/entities/sale.entity';
import { SaleItem } from '../../domain/entities/sale-item.entity';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { TypeUnitOfMeasurement, TypeProduct } from '@/shared/infra/enums/product';

export const makeCompany = (overrides: Record<string, unknown> = {}): Company => {
  const company = {
    id: 'company-1',
    fantasyName: 'Padaria Teste',
    cnpj: '12345678000199',
    address: null,
    ...overrides,
  };
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

export const makeSession = (
  overrides: Record<string, unknown> = {},
): CashRegisterSession => {
  const session = {
    id: 'session-1',
    company: makeCompany(),
    status: TypeCashRegisterSessionStatus.OPEN,
    openingAmount: 100,
    openedAt: new Date('2026-08-09T08:00:00Z'),
    openedBy: 'user-1',
    closedAt: null as Date | null,
    closedBy: null as string | null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ...overrides,
  };
  Object.setPrototypeOf(session, CashRegisterSession.prototype);
  return session as unknown as CashRegisterSession;
};

export const makeProduct = (overrides: Record<string, unknown> = {}): Product => {
  const product = {
    id: 'product-1',
    name: 'Pão Francês',
    barCode: null as string | null,
    typeProduct: TypeProduct.OWN_PRODUCTION,
    unitOfMeasurement: TypeUnitOfMeasurement.UN,
    stockManagement: true,
    active: true,
    salePrice: 1 as number | null,
    unitCostPrice: 0.5,
    pricePerKilogram: 8 as number | null,
    currentStock: 50 as number | null,
    imagePath: null as string | null,
    ...overrides,
  };
  Object.setPrototypeOf(product, Product.prototype);
  return product as unknown as Product;
};

export const makeSale = (overrides: Record<string, unknown> = {}): Sale => {
  const sale = {
    id: 'sale-1',
    company: makeCompany(),
    cashRegisterSession: makeSession(),
    status: TypeSaleStatus.COMPLETED,
    paymentMethod: TypePaymentMethod.CASH,
    totalAmount: 10,
    amountReceived: 10 as number | null,
    changeAmount: 0 as number | null,
    customerCpf: null as string | null,
    receiptPdfPath: null as string | null,
    soldBy: 'user-1',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date('2026-08-09T10:00:00Z'), updatedAt: new Date(), deletedAt: null },
    attachReceipt(receiptPdfPath: string, updatedBy: string) {
      this.receiptPdfPath = receiptPdfPath;
      this.updatedBy = updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(sale, Sale.prototype);
  return sale as unknown as Sale;
};

export const makeSaleItem = (overrides: Record<string, unknown> = {}): SaleItem => {
  const item = {
    id: 'sale-item-1',
    sale: makeSale(),
    product: makeProduct(),
    productNameSnapshot: 'Pão Francês',
    unitOfMeasurement: TypeUnitOfMeasurement.UN,
    quantity: 2 as number | null,
    weightInKg: null as number | null,
    unitPriceSnapshot: 1,
    unitCostSnapshot: 0.5,
    subtotal: 2,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    ...overrides,
  };
  Object.setPrototypeOf(item, SaleItem.prototype);
  return item as unknown as SaleItem;
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
