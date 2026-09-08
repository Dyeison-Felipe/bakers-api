import { ConfirmSubscriptionPaymentUseCase } from '../usecase/confirm-subscription-payment.usecase';
import { makeCompanySubscription, makeCompany, makeUser } from './fixtures';
import type { CompanySubscriptionRepository } from '../../domain/repositories/company-subscription.repository';
import type { PaymentRepository } from '../../domain/repositories/payment.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { MailService } from '@/shared/application/mail/mail.service';

describe('ConfirmSubscriptionPaymentUseCase', () => {
  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findByStripeSubscriptionId' | 'update'>
  >;
  let paymentRepository: jest.Mocked<Pick<PaymentRepository, 'save'>>;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'update' | 'delete'>>;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'update' | 'delete'>>;
  let mailService: jest.Mocked<MailService>;
  let sut: ConfirmSubscriptionPaymentUseCase;

  const baseInput = {
    stripeSubscriptionId: 'sub_123',
    approved: true,
    stripePaymentIntentId: 'pi_123',
    paymentStatus: 'paid',
    amount: 100,
  };

  beforeEach(() => {
    companySubscriptionRepository = {
      findByStripeSubscriptionId: jest
        .fn()
        .mockResolvedValue(makeCompanySubscription({ status: 'pending' })),
      update: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    paymentRepository = {
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
    };
    companyRepository = {
      update: jest.fn().mockImplementation((c) => Promise.resolve(c)),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(makeUser()),
      update: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };

    sut = new ConfirmSubscriptionPaymentUseCase(
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
      paymentRepository as unknown as PaymentRepository,
      companyRepository as unknown as CompanyRepository,
      userRepository as unknown as UserRepository,
      mailService,
    );
  });

  it('should do nothing when the subscription is unknown', async () => {
    companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(null);

    await sut.execute(baseInput);

    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  it('should be a no-op when the subscription is already rejected/cancelled (idempotent)', async () => {
    companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
      makeCompanySubscription({ status: 'rejected' }),
    );

    await sut.execute(baseInput);

    expect(companyRepository.update).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('should log a Payment record for every notification', async () => {
    await sut.execute(baseInput);

    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    const saved = paymentRepository.save.mock.calls[0][0];
    expect(saved.stripePaymentIntentId).toBe('pi_123');
    expect(saved.type).toBe('initial');
    expect(saved.amount).toBe(100);
  });

  describe('when approved and it is the initial charge (status was pending)', () => {
    it('should renew the company plan and activate it', async () => {
      const company = makeCompany({ active: false });
      const subscription = makeCompanySubscription({ status: 'pending', company });
      companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(subscription);

      await sut.execute(baseInput);

      expect(company.active).toBe(true);
      expect(companyRepository.update).toHaveBeenCalledWith(company);
    });

    it('should activate the CompanySubscription', async () => {
      const subscription = makeCompanySubscription({ status: 'pending' });
      companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(subscription);

      await sut.execute(baseInput);

      expect(subscription.status).toBe('active');
      expect(companySubscriptionRepository.update).toHaveBeenCalledWith(subscription);
    });

    it('should verify the admin user email and send the confirmation mail', async () => {
      const user = makeUser({ emailVerified: false });
      userRepository.findByEmail.mockResolvedValue(user);

      await sut.execute(baseInput);

      expect(user.emailVerified).toBe(true);
      expect(userRepository.update).toHaveBeenCalledWith(user);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'subscription-confirmed' }),
      );
    });
  });

  describe('when approved and it is a renewal (status was already active)', () => {
    it('should renew the company plan but not touch the subscription/user/email', async () => {
      const company = makeCompany({ active: true });
      const subscription = makeCompanySubscription({ status: 'active', company });
      companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(subscription);

      await sut.execute(baseInput);

      expect(companyRepository.update).toHaveBeenCalledWith(company);
      expect(companySubscriptionRepository.update).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('when rejected', () => {
    it('should soft-delete the optimistically-created company and user on initial rejection', async () => {
      const company = makeCompany({ id: 'company-1' });
      const user = makeUser({ id: 'user-1' });
      const subscription = makeCompanySubscription({ status: 'pending', company });
      companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(subscription);
      userRepository.findByEmail.mockResolvedValue(user);

      await sut.execute({ ...baseInput, approved: false });

      expect(subscription.status).toBe('rejected');
      expect(companyRepository.delete).toHaveBeenCalledWith('company-1');
      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should do nothing extra on a renewal rejection (Stripe retries on its own)', async () => {
      const subscription = makeCompanySubscription({ status: 'active' });
      companySubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(subscription);

      await sut.execute({ ...baseInput, approved: false });

      expect(companyRepository.delete).not.toHaveBeenCalled();
      expect(companyRepository.update).not.toHaveBeenCalled();
    });
  });
});
