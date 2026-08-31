import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Company } from '../../domain/entities/company.entity';
import { Plan } from '@/core/plan/domain/entities/plan.entity';
import { Address } from '@/core/address/domain/entities/address.entity';
import { Role } from '@/core/role/domain/entities/role.entity';

export const makeCompany = (overrides: Record<string, unknown> = {}): Company => {
  const company = {
    id: 'company-1',
    fantasyName: 'Padaria X',
    socialReazon: 'Padaria X LTDA',
    cnpj: '12345678000190',
    email: 'contato@padaria.com',
    phoneNumber: '42999998888',
    active: true,
    stateRegistration: '123456',
    address: null as Address | null,
    plan: null as Plan | null,
    planStartedAt: new Date('2026-01-01T00:00:00.000Z'),
    planExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    update(props: {
      fantasyName: string;
      socialReazon: string;
      cnpj: string;
      email: string;
      phoneNumber: string;
      stateRegistration: string;
      plan: Plan;
      updatedBy: string;
    }) {
      this.fantasyName = props.fantasyName;
      this.socialReazon = props.socialReazon;
      this.cnpj = props.cnpj;
      this.email = props.email;
      this.phoneNumber = props.phoneNumber;
      this.stateRegistration = props.stateRegistration;
      this.plan = props.plan;
      this.updatedBy = props.updatedBy;
    },
    renewPlan(plan: Plan, updatedBy: string) {
      const now = new Date();
      this.plan = plan;
      this.planStartedAt = now;
      this.planExpiresAt = new Date(
        now.getTime() + plan.duration * 24 * 60 * 60 * 1000,
      );
      this.active = true;
      this.updatedBy = updatedBy;
    },
    setActive(active: boolean, updatedBy: string) {
      this.active = active;
      this.updatedBy = updatedBy;
    },
    ...overrides,
  };
  Object.setPrototypeOf(company, Company.prototype);
  return company as unknown as Company;
};

// Plan precisa estar prototipado pra Plan.prototype: CompanyRules valida
// `plan` com @IsInstance(Plan) quando Company.create() é chamado de verdade
// (em CreateCompanyUseCase).
export const makePlan = (overrides: Record<string, unknown> = {}): Plan => {
  const plan = {
    id: 'plan-1',
    name: 'Básico',
    price: 0,
    active: true,
    description: 'Plano básico',
    duration: 30,
    permissions: [] as unknown[],
    ...overrides,
  };
  Object.setPrototypeOf(plan, Plan.prototype);
  return plan as unknown as Plan;
};

export const makeCity = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Curitiba',
  state: { id: 'state-1', name: 'Paraná', uf: 'PR' },
  ...overrides,
});

export const makeAddress = (overrides: Record<string, unknown> = {}): Address => {
  const address = {
    id: 'address-1',
    cep: '80000000',
    neighborhood: 'Centro',
    street: 'Rua X',
    number: '100',
    complement: null,
    latitude: null,
    longitude: null,
    city: makeCity(),
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ...overrides,
  };
  Object.setPrototypeOf(address, Address.prototype);
  return address as unknown as Address;
};

export const makeRole = (overrides: Record<string, unknown> = {}): Role => {
  const role = {
    id: 'role-1',
    name: 'Admin',
    company: makeCompany(),
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    ...overrides,
  };
  Object.setPrototypeOf(role, Role.prototype);
  return role as unknown as Role;
};

export const makeLoggedUser = (
  overrides: Partial<{ id: string; company: Company }> = {},
): UserEntity => {
  return {
    id: overrides.id ?? 'user-1',
    company: overrides.company ?? makeCompany(),
  } as unknown as UserEntity;
};
