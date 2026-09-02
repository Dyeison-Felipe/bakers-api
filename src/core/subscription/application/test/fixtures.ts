import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { Payment } from '@/core/subscription/domain/entities/payment.entity';
import { makeCompany, makePlan } from '@/core/company/application/test/fixtures';

export const makeCompanySubscription = (
  overrides: Record<string, unknown> = {},
): CompanySubscription => {
  const companySubscription = {
    id: 'company-subscription-1',
    company: makeCompany(),
    plan: makePlan({ price: 100, duration: 30 }),
    mercadoPagoSubscriptionId: 'mp-subscription-1',
    status: 'pending' as CompanySubscription['status'],
    payerEmail: 'admin@padaria.com',
    cardLastFourDigits: null as string | null,
    cardBrand: null as string | null,
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

export const makePayment = (overrides: Record<string, unknown> = {}): Payment => {
  const payment = {
    id: 'payment-1',
    companySubscriptionId: 'company-subscription-1',
    mercadoPagoPaymentId: 'mp-payment-1',
    type: 'initial' as Payment['type'],
    status: 'approved',
    statusDetail: 'accredited' as string | null,
    amount: 100,
    paidAt: new Date() as Date | null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ...overrides,
  };
  Object.setPrototypeOf(payment, Payment.prototype);
  return payment as unknown as Payment;
};
