import { VerifyCodeUseCase } from '../usecase/verify-code.usecase';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { makeEnvConfig, makeUser } from './fixtures';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { JwtService } from '@/shared/application/jwt/jwt.service';

describe('VerifyCodeUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByCode' | 'update'>>;
  let jwtService: jest.Mocked<JwtService>;
  let envConfigService: ReturnType<typeof makeEnvConfig>;
  let setCookie: jest.Mock;
  let sut: VerifyCodeUseCase;

  beforeEach(() => {
    userRepository = {
      findByCode: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      generateJwt: jest.fn().mockResolvedValue({ token: 'reset-token' }),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn(),
    };
    envConfigService = makeEnvConfig();
    setCookie = jest.fn();

    sut = new VerifyCodeUseCase(
      userRepository as unknown as UserRepository,
      jwtService,
      envConfigService,
    );
  });

  it('should throw BadRequestError when no user matches the code/email', async () => {
    userRepository.findByCode.mockResolvedValue(null);

    await expect(
      sut.execute({ code: '123456', email: 'x@x.com', setCookie }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the code does not match the stored one', async () => {
    const user = makeUser({
      passwordResetCode: '111111',
      expiredAtCode: new Date(Date.now() + 3600_000),
    });
    userRepository.findByCode.mockResolvedValue(user);

    await expect(
      sut.execute({ code: '222222', email: user.email, setCookie }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the code has expired', async () => {
    const user = makeUser({
      passwordResetCode: '123456',
      expiredAtCode: new Date(Date.now() - 1000),
    });
    userRepository.findByCode.mockResolvedValue(user);

    await expect(
      sut.execute({ code: '123456', email: user.email, setCookie }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should clear the reset code and set the forgot-password cookie on success', async () => {
    const user = makeUser({
      passwordResetCode: '123456',
      expiredAtCode: new Date(Date.now() + 3600_000),
    });
    userRepository.findByCode.mockResolvedValue(user);

    await sut.execute({ code: '123456', email: user.email, setCookie });

    expect(user.passwordResetCode).toBeNull();
    expect(userRepository.update).toHaveBeenCalledWith(user);
    expect(setCookie).toHaveBeenCalledWith(
      AuthConstants.tokenForgotPassword,
      'reset-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should throw BadRequestError when token generation fails', async () => {
    const user = makeUser({
      passwordResetCode: '123456',
      expiredAtCode: new Date(Date.now() + 3600_000),
    });
    userRepository.findByCode.mockResolvedValue(user);
    jwtService.generateJwt.mockRejectedValue(new Error('boom'));

    await expect(
      sut.execute({ code: '123456', email: user.email, setCookie }),
    ).rejects.toThrow(BadRequestError);
  });
});
