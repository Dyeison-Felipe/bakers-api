import { SubscribePlanUseCase } from '../usecase/subscribe-plan.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { makeCompanySubscription, makeCompany, makePlan } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { CompanySubscription } from '../../domain/entities/company-subscription.entity';

describe('SubscribePlanUseCase', () => {
  const input = { planId: 'plan-1', stripePaymentMethodId: 'pm_123' };
  const expiredCompany = () =>
    makeCompany({ active: false, planExpiresAt: new Date(Date.now() - 1000) });

  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findLatestByCompanyId' | 'save'>
  >;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'findById'>>;
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let stripeService: jest.Mocked<
    Pick<
      StripeService,
      | 'createCustomer'
      | 'attachPaymentMethod'
      | 'retrievePaymentMethodCardDetails'
      | 'createSubscription'
      | 'confirmInvoicePayment'
    >
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: SubscribePlanUseCase;

  beforeEach(() => {
    companySubscriptionRepository = {
      findLatestByCompanyId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    companyRepository = {
      findById: jest.fn().mockResolvedValue(expiredCompany()),
    };
    planRepository = {
      findById: jest.fn().mockResolvedValue(makePlan()),
    };
    stripeService = {
      createCustomer: jest.fn().mockResolvedValue('cus_new'),
      attachPaymentMethod: jest.fn().mockResolvedValue(undefined),
      retrievePaymentMethodCardDetails: jest
        .fn()
        .mockResolvedValue({ brand: 'visa', last4: '4242' }),
      createSubscription: jest
        .fn()
        .mockResolvedValue({ subscriptionId: 'sub_new', latestInvoiceId: 'in_123' }),
      confirmInvoicePayment: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue({
        id: 'user-1',
        email: 'admin@padaria.com',
        company: makeCompany({ id: 'company-1' }),
      }),
      setLoggedUser: jest.fn(),
    };

    sut = new SubscribePlanUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      companyRepository as unknown as CompanyRepository,
      planRepository as unknown as PlanRepository,
      stripeService as unknown as StripeService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the plan does not exist or is inactive', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ active: false }));

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should refuse a free plan (it could otherwise be renewed forever)', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ price: 0 }));

    await expect(sut.execute(input)).rejects.toThrow(BadRequestError);
    expect(stripeService.createSubscription).not.toHaveBeenCalled();
  });

  it('should refuse a paid plan without a Stripe price configured', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ stripePriceId: null }));

    await expect(sut.execute(input)).rejects.toThrow(BadRequestError);
  });

  it.each(['pending', 'active'] as const)(
    'should refuse when the latest subscription is %s',
    async (status) => {
      companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
        makeCompanySubscription({ status }),
      );

      await expect(sut.execute(input)).rejects.toThrow(ConflictError);
      expect(stripeService.createSubscription).not.toHaveBeenCalled();
    },
  );

  it('should refuse when a cancelled subscription is still within its paid period', async () => {
    companyRepository.findById.mockResolvedValue(
      makeCompany({ active: true, planExpiresAt: new Date(Date.now() + 86_400_000) }),
    );
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'cancelled' }),
    );

    await expect(sut.execute(input)).rejects.toThrow(ConflictError);
  });

  it('should reuse the Stripe customer of a previous subscription', async () => {
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'cancelled', stripeCustomerId: 'cus_old' }),
    );

    await sut.execute(input);

    expect(stripeService.createCustomer).not.toHaveBeenCalled();
    expect(stripeService.attachPaymentMethod).toHaveBeenCalledWith('cus_old', 'pm_123');
  });

  it('should save a pending "renewal" subscription before charging the first invoice', async () => {
    const calls: string[] = [];
    companySubscriptionRepository.save.mockImplementation((s) => {
      calls.push('save');
      return Promise.resolve(s);
    });
    stripeService.confirmInvoicePayment.mockImplementation(() => {
      calls.push('confirm');
      return Promise.resolve();
    });

    await sut.execute(input);

    const saved = companySubscriptionRepository.save.mock
      .calls[0][0] as CompanySubscription;
    expect(saved.status).toBe('pending');
    expect(saved.origin).toBe('renewal');
    expect(saved.stripeSubscriptionId).toBe('sub_new');
    expect(saved.stripeCustomerId).toBe('cus_new');
    expect(saved.payerEmail).toBe('admin@padaria.com');
    expect(saved.cardLastFourDigits).toBe('4242');
    expect(stripeService.confirmInvoicePayment).toHaveBeenCalledWith('in_123', 'pm_123');
    expect(calls).toEqual(['save', 'confirm']);
  });

  it('should not change the company plan by itself (only the confirmed payment does)', async () => {
    const company = expiredCompany();
    const renewSpy = jest.spyOn(company, 'renewPlan');
    companyRepository.findById.mockResolvedValue(company);

    await sut.execute(input);

    expect(renewSpy).not.toHaveBeenCalled();
    expect(company.active).toBe(false);
  });
});
