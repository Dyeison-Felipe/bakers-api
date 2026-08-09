import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { CashRegisterSession } from '../../domain/entities/cash-register-session.entity';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

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

// company/cashRegisterSession precisam ficar ligados ao prototype real
// (CashRegisterSessionRules usa @IsInstance(Company), e
// CashRegisterMovementRules usa @IsInstance(CashRegisterSession)) — mesmo
// padrão do módulo de batch.
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
    totalCash: null as number | null,
    totalPix: null as number | null,
    totalCard: null as number | null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    close(props: { totalCash: number; totalPix: number; totalCard: number; closedBy: string }) {
      this.status = TypeCashRegisterSessionStatus.CLOSED;
      this.closedAt = new Date();
      this.closedBy = props.closedBy;
      this.totalCash = props.totalCash;
      this.totalPix = props.totalPix;
      this.totalCard = props.totalCard;
      this.updatedBy = props.closedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(session, CashRegisterSession.prototype);
  return session as unknown as CashRegisterSession;
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
