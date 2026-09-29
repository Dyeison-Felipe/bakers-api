import { CancelSubscriptionUseCase } from '../usecase/cancel-subscription.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompanySubscription, makeCompany } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CancelSubscriptionUseCase', () => {
  const periodEnd = new Date('2026-10-28T12:00:00.000Z');

  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findActiveByCompanyId' | 'update'>
  >;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'update'>>;
  let stripeService: jest.Mocked<Pick<StripeService, 'cancelSubscriptionAtPeriodEnd'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CancelSubscriptionUseCase;

  beforeEach(() => {
    companySubscriptionRepository = {
      findActiveByCompanyId: jest
        .fn()
        .mockResolvedValue(makeCompanySubscription({ status: 'active' })),
      update: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    companyRepository = {
      update: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    stripeService = {
      cancelSubscriptionAtPeriodEnd: jest.fn().mockResolvedValue({
        status: 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
      }),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: makeCompany({ id: 'company-1' }) }),
      setLoggedUser: jest.fn(),
    };

    sut = new CancelSubscriptionUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      companyRepository as unknown as CompanyRepository,
      stripeService as unknown as StripeService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the company has no active subscription', async () => {
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(null);

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
    expect(stripeService.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
  });

  it('should cancel the subscription at period end on Stripe and mark it cancelled locally', async () => {
    const subscription = makeCompanySubscription({ status: 'active' });
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(subscription);

    await sut.execute();

    expect(stripeService.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith('sub_123');
    expect(subscription.status).toBe('cancelled');
    expect(companySubscriptionRepository.update).toHaveBeenCalledWith(subscription);
  });

  it('should keep the company active until exactly the end of the paid period (no renewal grace)', async () => {
    const company = makeCompany({ active: true });
    const setActiveSpy = jest.spyOn(company, 'setActive');
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'active', company }),
    );

    await sut.execute();

    expect(setActiveSpy).not.toHaveBeenCalled();
    expect(company.active).toBe(true);
    expect(company.planExpiresAt).toEqual(periodEnd);
    expect(companyRepository.update).toHaveBeenCalledWith(company);
  });

  it('should leave the plan window untouched when Stripe does not return the period', async () => {
    const company = makeCompany({ active: true });
    const originalExpiresAt = company.planExpiresAt;
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'active', company }),
    );
    stripeService.cancelSubscriptionAtPeriodEnd.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: true,
    });

    await sut.execute();

    expect(company.planExpiresAt).toBe(originalExpiresAt);
    expect(companyRepository.update).not.toHaveBeenCalled();
  });
});
