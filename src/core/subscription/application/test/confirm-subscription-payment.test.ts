import { ConfirmSubscriptionPaymentUseCase } from '../usecase/confirm-subscription-payment.usecase';
import { makeCompanySubscription } from './fixtures';
import { makeUser } from '@/core/user/application/test/fixtures';
import type { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import type { PaymentRepository } from '@/core/subscription/domain/repositories/payment.repository';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { MailService } from '@/shared/application/mail/mail.service';

describe('ConfirmSubscriptionPaymentUseCase', () => {
  let companySubscriptionRepository: jest.Mocked<
    Pick<CompanySubscriptionRepository, 'findByMercadoPagoSubscriptionId' | 'update'>
  >;
  let paymentRepository: jest.Mocked<Pick<PaymentRepository, 'save'>>;
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'update' | 'delete'>>;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'update' | 'delete'>>;
  let mailService: jest.Mocked<MailService>;
  let sut: ConfirmSubscriptionPaymentUseCase;

  const baseInput = {
    mercadoPagoSubscriptionId: 'mp-subscription-1',
    approved: true,
    mercadoPagoPaymentId: 'mp-payment-1',
    paymentStatus: 'approved',
    paymentStatusDetail: 'accredited',
    amount: 100,
  };

  beforeEach(() => {
    companySubscriptionRepository = {
      findByMercadoPagoSubscriptionId: jest
        .fn()
        .mockResolvedValue(makeCompanySubscription()),
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
    companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
      null,
    );

    await sut.execute(baseInput);

    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  it('should be idempotent: does nothing when the subscription was already resolved', async () => {
    companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
      makeCompanySubscription({ status: 'rejected' }),
    );

    await sut.execute(baseInput);

    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  describe('approved + pending (1ª cobrança)', () => {
    it('should renew the company plan, activate the subscription, verify the admin email and send the confirmation email', async () => {
      const companySubscription = makeCompanySubscription({ status: 'pending' });
      companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
        companySubscription,
      );

      await sut.execute(baseInput);

      expect(companyRepository.update).toHaveBeenCalledTimes(1);
      expect(companySubscription.status).toBe('active');
      expect(companySubscriptionRepository.update).toHaveBeenCalledWith(
        companySubscription,
      );
      expect(userRepository.update).toHaveBeenCalledTimes(1);
      const updatedUser = userRepository.update.mock.calls[0][0];
      expect(updatedUser.emailVerified).toBe(true);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'subscription-confirmed' }),
      );
    });

    it('should log the payment as type "initial"', async () => {
      await sut.execute(baseInput);

      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
      const savedPayment = paymentRepository.save.mock.calls[0][0];
      expect(savedPayment.type).toBe('initial');
      expect(savedPayment.status).toBe('approved');
      expect(savedPayment.amount).toBe(100);
    });
  });

  describe('approved + active (renovação)', () => {
    it('should renew the company plan without touching the subscription status or the user', async () => {
      const companySubscription = makeCompanySubscription({ status: 'active' });
      companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
        companySubscription,
      );

      await sut.execute(baseInput);

      expect(companyRepository.update).toHaveBeenCalledTimes(1);
      expect(companySubscriptionRepository.update).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('should log the payment as type "renewal"', async () => {
      companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
        makeCompanySubscription({ status: 'active' }),
      );

      await sut.execute(baseInput);

      const savedPayment = paymentRepository.save.mock.calls[0][0];
      expect(savedPayment.type).toBe('renewal');
    });
  });

  describe('recusado + pending (1ª cobrança falhou)', () => {
    it('should reject the subscription and delete the company and the admin user', async () => {
      const companySubscription = makeCompanySubscription({ status: 'pending' });
      companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
        companySubscription,
      );

      await sut.execute({ ...baseInput, approved: false, paymentStatus: 'rejected' });

      expect(companySubscription.status).toBe('rejected');
      expect(companyRepository.delete).toHaveBeenCalledWith(
        companySubscription.company.id,
      );
      expect(userRepository.delete).toHaveBeenCalledTimes(1);
      expect(companyRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('recusado + active (renovação falhou)', () => {
    it('should not delete or deactivate anything — just logs the failed payment', async () => {
      companySubscriptionRepository.findByMercadoPagoSubscriptionId.mockResolvedValue(
        makeCompanySubscription({ status: 'active' }),
      );

      await sut.execute({ ...baseInput, approved: false, paymentStatus: 'rejected' });

      expect(companyRepository.delete).not.toHaveBeenCalled();
      expect(companyRepository.update).not.toHaveBeenCalled();
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
