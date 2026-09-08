import { CancelSubscriptionUseCase } from '../usecase/cancel-subscription.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompanySubscription, makeCompany } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CancelSubscriptionUseCase', () => {
  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findActiveByCompanyId' | 'update'>
  >;
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
    stripeService = {
      cancelSubscriptionAtPeriodEnd: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue({ company: makeCompany({ id: 'company-1' }) }),
      setLoggedUser: jest.fn(),
    };

    sut = new CancelSubscriptionUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
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

  it('should never touch company.active/planExpiresAt directly', async () => {
    const company = makeCompany({ active: true });
    const setActiveSpy = jest.spyOn(company, 'setActive');
    const renewPlanSpy = jest.spyOn(company, 'renewPlan');
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'active', company }),
    );

    await sut.execute();

    expect(setActiveSpy).not.toHaveBeenCalled();
    expect(renewPlanSpy).not.toHaveBeenCalled();
  });
});
