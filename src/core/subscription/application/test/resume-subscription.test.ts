import { ResumeSubscriptionUseCase } from '../usecase/resume-subscription.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeCompanySubscription, makeCompany } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('ResumeSubscriptionUseCase', () => {
  const periodEnd = new Date('2026-10-28T12:00:00.000Z');
  const runningSnapshot = {
    status: 'active' as const,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: true,
  };

  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findLatestByCompanyId' | 'update'>
  >;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'update'>>;
  let stripeService: jest.Mocked<
    Pick<StripeService, 'getSubscription' | 'resumeSubscription'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: ResumeSubscriptionUseCase;

  beforeEach(() => {
    companySubscriptionRepository = {
      findLatestByCompanyId: jest
        .fn()
        .mockResolvedValue(makeCompanySubscription({ status: 'cancelled' })),
      update: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    companyRepository = {
      update: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    stripeService = {
      getSubscription: jest.fn().mockResolvedValue(runningSnapshot),
      resumeSubscription: jest
        .fn()
        .mockResolvedValue({ ...runningSnapshot, cancelAtPeriodEnd: false }),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: makeCompany({ id: 'company-1' }) }),
      setLoggedUser: jest.fn(),
    };

    sut = new ResumeSubscriptionUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      companyRepository as unknown as CompanyRepository,
      stripeService as unknown as StripeService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when there is no cancelled subscription', async () => {
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(
      makeCompanySubscription({ status: 'active' }),
    );

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
    expect(stripeService.resumeSubscription).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when Stripe already ended the subscription', async () => {
    stripeService.getSubscription.mockResolvedValue({
      status: 'canceled',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
    });

    await expect(sut.execute()).rejects.toThrow(BadRequestError);
    expect(stripeService.resumeSubscription).not.toHaveBeenCalled();
  });

  it('should resume on Stripe, reactivate locally and give back the renewal grace', async () => {
    const company = makeCompany({ active: true, planExpiresAt: periodEnd });
    const subscription = makeCompanySubscription({ status: 'cancelled', company });
    companySubscriptionRepository.findLatestByCompanyId.mockResolvedValue(subscription);

    await sut.execute();

    expect(stripeService.resumeSubscription).toHaveBeenCalledWith('sub_123');
    expect(subscription.status).toBe('active');
    expect(companySubscriptionRepository.update).toHaveBeenCalledWith(subscription);
    expect(company.planExpiresAt).toEqual(new Date('2026-10-30T12:00:00.000Z'));
    expect(companyRepository.update).toHaveBeenCalledWith(company);
  });
});
