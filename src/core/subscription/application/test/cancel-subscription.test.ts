import { CancelSubscriptionUseCase } from '../usecase/cancel-subscription.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompanySubscription } from './fixtures';
import type { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import type { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CancelSubscriptionUseCase', () => {
  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findActiveByCompanyId' | 'update'>
  >;
  let mercadoPagoService: jest.Mocked<Pick<MercadoPagoService, 'cancelSubscription'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CancelSubscriptionUseCase;

  beforeEach(() => {
    companySubscriptionRepository = {
      findActiveByCompanyId: jest
        .fn()
        .mockResolvedValue(makeCompanySubscription({ status: 'active' })),
      update: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    mercadoPagoService = {
      cancelSubscription: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    };

    sut = new CancelSubscriptionUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      mercadoPagoService as unknown as MercadoPagoService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the company has no active subscription', async () => {
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(null);

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
    expect(mercadoPagoService.cancelSubscription).not.toHaveBeenCalled();
  });

  it('should cancel the subscription on Mercado Pago and mark it as cancelled locally', async () => {
    const companySubscription = makeCompanySubscription({ status: 'active' });
    companySubscriptionRepository.findActiveByCompanyId.mockResolvedValue(
      companySubscription,
    );

    await sut.execute();

    expect(mercadoPagoService.cancelSubscription).toHaveBeenCalledWith(
      companySubscription.mercadoPagoSubscriptionId,
    );
    expect(companySubscription.status).toBe('cancelled');
    expect(companySubscriptionRepository.update).toHaveBeenCalledWith(
      companySubscription,
    );
  });
});
