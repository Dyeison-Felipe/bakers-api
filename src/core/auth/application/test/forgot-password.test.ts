import { ForgotPasswordUseCase } from '../usecase/forgot-password.usecase';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeUser } from './fixtures';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { MailService } from '@/shared/application/mail/mail.service';

describe('ForgotPasswordUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'update'>>;
  let mailService: jest.Mocked<MailService>;
  let sut: ForgotPasswordUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };

    sut = new ForgotPasswordUseCase(
      userRepository as unknown as UserRepository,
      mailService,
    );
  });

  it('should throw BadRequestError (generic message) when the email is not registered', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(sut.execute({ email: 'x@x.com' })).rejects.toThrow(
      BadRequestError,
    );
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('should generate a 6-digit reset code, persist it and send the email', async () => {
    const user = makeUser({ email: 'joana@example.com', username: 'joana' });
    userRepository.findByEmail.mockResolvedValue(user);

    await sut.execute({ email: 'joana@example.com' });

    expect(user.passwordResetCode).toMatch(/^\d{6}$/);
    expect(user.expiredAtCode).toBeInstanceOf(Date);
    expect(userRepository.update).toHaveBeenCalledWith(user);

    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joana@example.com',
        template: 'forgot-password',
        context: expect.objectContaining({
          name: 'joana',
          code: user.passwordResetCode,
        }),
      }),
    );
  });

  it('should throw the same generic BadRequestError when sending the email fails (does not leak whether the email exists)', async () => {
    const user = makeUser();
    userRepository.findByEmail.mockResolvedValue(user);
    mailService.sendMail.mockRejectedValue(new Error('smtp down'));

    await expect(sut.execute({ email: user.email })).rejects.toThrow(
      BadRequestError,
    );
  });
});
