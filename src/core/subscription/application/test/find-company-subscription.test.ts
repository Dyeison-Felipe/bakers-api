import { FindCompanySubscriptionUseCase } from '../usecase/find-company-subscription.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompanySubscription, makeCompany, makePlan } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCompanySubscriptionUseCase', () => {
  const periodEnd = new Date('2026-10-28T12:00:00.000Z');

  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findLatestByCompanyId'>
  >;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'findById'>>;
  let stripeService: jest.Mocked<Pick<StripeService, 'getSubscription'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCompanySubscriptionUseCase;

  beforeEach(() => {
    companySubscriptionRepository = {
      findLatestByCompanyId: jest.fn().mockResolvedValue(null),
    };
    companyRepository = {
      findById: jest.fn().mockResolvedValue(
        makeCompany({
          active: true,
          plan: makePlan({ id: 'free', name: 'Gratuito', price: 0 }),
          planExpiresAt: new Date(Date.now() + 86_400_000),
        }),
      ),
    };
    stripeService = {
      getSubscription: jest.fn().mockResolvedValue({
        status: 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      }),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: makeCompany({ id: 'company-1' }) }),
      setLoggedUser: jest.fn(),
    };

    sut = new FindCompanySubscriptionUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      companyRepository as unknown as CompanyRepository,
      stripeService as unknown as StripeService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
  });

  it('should return the current plan and no subscription for a company that never paid', async () => {
    const output = await sut.execute();

    expect(output.plan).toEqual({ id: 'free', name: 'Gratuito', price: 0 });
    expect(output.planExpired).toBe(false);
    expect(output.subscription).toBeNull();
    expect(stripeService.getSubscription).not.toHaveBeenCalled();
  });

  it('should flag an expired plan', async () => {
    companyRepository.findById.mockResolvedValue(
      makeCompany({ active: true, planExpiresAt: new Date(Date.now() - 1000) }),
    );

    const output = await sut.execute();

    expect(output.planExpired).toBe(true);
  });

  it('should include the next charge date of an active subscription', async () => {
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'active' }),
    );

    const output = await sut.execute();

    expect(output.subscription).toEqual({
      status: 'active',
      planName: 'Plano Pago',
      cardBrand: 'visa',
      cardLastFourDigits: '4242',
      currentPeriodEnd: periodEnd,
    });
  });

  it('should not ask Stripe for the period of a pending subscription', async () => {
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'pending' }),
    );

    const output = await sut.execute();

    expect(output.subscription?.currentPeriodEnd).toBeNull();
    expect(stripeService.getSubscription).not.toHaveBeenCalled();
  });

  it('should still answer when Stripe is unavailable (date is informative only)', async () => {
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'cancelled' }),
    );
    stripeService.getSubscription.mockRejectedValue(new Error('timeout'));

    const output = await sut.execute();

    expect(output.subscription?.status).toBe('cancelled');
    expect(output.subscription?.currentPeriodEnd).toBeNull();
  });
});
