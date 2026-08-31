import { PlanExpirationJob } from '../plan-expiration.job';
import { makeCompany } from '../../../application/test/fixtures';
import type { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import type { MailService } from '@/shared/application/mail/mail.service';

describe('PlanExpirationJob', () => {
  let companyRepository: jest.Mocked<
    Pick<CompanyRepository, 'findAllActiveWithExpiredPlan' | 'update'>
  >;
  let mailService: jest.Mocked<MailService>;
  let sut: PlanExpirationJob;

  beforeEach(() => {
    companyRepository = {
      findAllActiveWithExpiredPlan: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    mailService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    sut = new PlanExpirationJob(
      companyRepository as unknown as CompanyRepository,
      mailService,
    );
  });

  it('does nothing when there are no companies with an expired plan', async () => {
    await sut.handleExpiration();

    expect(companyRepository.update).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('deactivates every expired company and sends the plan-expired email', async () => {
    const company = makeCompany({ id: 'company-1', active: true });
    companyRepository.findAllActiveWithExpiredPlan.mockResolvedValue([company]);

    await sut.handleExpiration();

    expect(company.active).toBe(false);
    expect(companyRepository.update).toHaveBeenCalledWith(company);
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: company.email,
        template: 'plan-expired',
      }),
    );
  });

  it('keeps processing the remaining companies when one fails', async () => {
    const failing = makeCompany({ id: 'company-1', active: true });
    const succeeding = makeCompany({ id: 'company-2', active: true, email: 'other@padaria.com' });
    companyRepository.findAllActiveWithExpiredPlan.mockResolvedValue([
      failing,
      succeeding,
    ]);
    companyRepository.update
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce(succeeding);

    await sut.handleExpiration();

    expect(companyRepository.update).toHaveBeenCalledTimes(2);
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'other@padaria.com' }),
    );
  });
});
