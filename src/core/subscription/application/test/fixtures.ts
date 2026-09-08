import { CompanySubscription } from '../../domain/entities/company-subscription.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Plan } from '@/core/plan/domain/entities/plan.entity';
import { UserEntity } from '@/core/user/domain/entities/user.entity';

export const makePlan = (overrides: Record<string, unknown> = {}): Plan => {
  const plan = {
    id: 'plan-1',
    name: 'Plano Pago',
    price: 100,
    active: true,
    description: 'Plano pago',
    duration: 30,
    userLimit: null as number | null,
    stripeProductId: 'prod_123',
    stripePriceId: 'price_123',
    permissions: [] as unknown[],
    ...overrides,
  };
  Object.setPrototypeOf(plan, Plan.prototype);
  return plan as unknown as Plan;
};

export const makeCompany = (overrides: Record<string, unknown> = {}): Company => {
  const company = {
    id: 'company-1',
    fantasyName: 'Padaria X',
    socialReazon: 'Padaria X LTDA',
    cnpj: '12345678000190',
    email: 'contato@padaria.com',
    phoneNumber: '42999998888',
    active: false,
    stateRegistration: '123456',
    address: null,
    plan: makePlan(),
    planStartedAt: new Date('2026-01-01T00:00:00.000Z'),
    planExpiresAt: new Date('2026-01-31T00:00:00.000Z'),
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    renewPlan(plan: Plan, updatedBy: string) {
      const now = new Date();
      this.plan = plan;
      this.planStartedAt = now;
      this.planExpiresAt = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
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

export const makeUser = (overrides: Record<string, unknown> = {}): UserEntity => {
  const user = {
    id: 'user-1',
    email: 'admin@padaria.com',
    emailVerified: false,
    emailVerifiedAt: null as Date | null,
    verifyEmail() {
      this.emailVerified = true;
      this.emailVerifiedAt = new Date();
    },
    ...overrides,
  };
  Object.setPrototypeOf(user, UserEntity.prototype);
  return user as unknown as UserEntity;
};

export const makeCompanySubscription = (
  overrides: Record<string, unknown> = {},
): CompanySubscription => {
  const companySubscription = {
    id: 'company-subscription-1',
    company: makeCompany(),
    plan: makePlan(),
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_123',
    status: 'pending' as CompanySubscription['status'],
    payerEmail: 'admin@padaria.com',
    cardLastFourDigits: '4242',
    cardBrand: 'visa',
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    activate() {
      this.status = 'active';
    },
    reject() {
      this.status = 'rejected';
    },
    cancel() {
      this.status = 'cancelled';
    },
    ...overrides,
  };
  Object.setPrototypeOf(companySubscription, CompanySubscription.prototype);
  return companySubscription as unknown as CompanySubscription;
};
