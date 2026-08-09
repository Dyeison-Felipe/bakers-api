import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Category } from '../../domain/entities/category.entity';

export const makeCompany = (overrides: Partial<Company> = {}): Company => {
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
    update(props: { name: string; parent: { id: string; name: string } | null; updatedBy: string }) {
      this.name = props.name;
      this.parent = props.parent;
      this.updatedBy = props.updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(category, Category.prototype);
  return category as unknown as Category;
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
