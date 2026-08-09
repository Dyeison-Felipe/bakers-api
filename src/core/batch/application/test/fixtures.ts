import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Product } from '@/core/product/domain/entities/product.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Batch } from '../../domain/entities/batch.entity';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

// Monta um objeto plano com as próprias propriedades (não passa pelo
// construtor real, então não roda o validador nem precisa preencher todos os
// campos obrigatórios da entidade) e só religa o prototype pra passar em
// checagens @IsInstance(Product)/@IsInstance(Company) (class-validator usa
// instanceof). Como são propriedades próprias, a leitura nunca passa pelos
// getters da classe real — evita o problema de getter-only da BaseEntity.
export const makeProduct = (overrides: Partial<Product> = {}): Product => {
  const product = {
    id: 'product-1',
    name: 'Pão Francês',
    unitCostPrice: 2,
    pricePerKilogram: 8,
    currentStock: 10,
    stockManagement: true,
    expirationDateInDays: '3',
    ...overrides,
  };
  Object.setPrototypeOf(product, Product.prototype);
  return product as Product;
};

export const makeCompany = (overrides: Partial<Company> = {}): Company => {
  const company = {
    id: 'company-1',
    ...overrides,
  };
  Object.setPrototypeOf(company, Company.prototype);
  return company as Company;
};

// company vem prototipado pra Company.prototype de propósito: usecases como
// CreateBatchUseCase usam `loggedUser.company` direto como o `company` que é
// passado pro Batch.create(), cuja validação exige @IsInstance(Company).
export const makeLoggedUser = (
  overrides: Partial<{ id: string; company: Company }> = {},
): UserEntity => {
  return {
    id: overrides.id ?? 'user-1',
    company: overrides.company ?? makeCompany(),
  } as unknown as UserEntity;
};

// batchId em BatchMovement é validado com @IsUUID(), então o id default do
// lote precisa parecer um UUID de verdade (senão qualquer usecase que cria
// um BatchMovement a partir do lote falha na validação da entidade).
export const makeBatch = (overrides: Record<string, unknown> = {}): Batch => {
  const quantity = (overrides.quantity as number) ?? 10;
  const batch = {
    id: '11111111-1111-4111-8111-111111111111',
    product: makeProduct(),
    company: makeCompany(),
    dailyProductionItemId: null,
    quantity,
    remainingQuantity: quantity,
    unitOfMeasurement: TypeUnitOfMeasurement.UN,
    productionDate: new Date('2026-08-09T00:00:00Z'),
    expirationDate: null as Date | null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    consume(qty: number, updatedBy: string) {
      this.remainingQuantity -= qty;
      this.updatedBy = updatedBy;
    },
    applyCorrection(
      newQuantity: number,
      newRemainingQuantity: number,
      expirationDate: Date | null,
      updatedBy: string,
    ) {
      this.quantity = newQuantity;
      this.remainingQuantity = newRemainingQuantity;
      this.expirationDate = expirationDate;
      this.updatedBy = updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(batch, Batch.prototype);
  return batch as unknown as Batch;
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
