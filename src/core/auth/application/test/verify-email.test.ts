import { VerifyEmailUseCase } from '../usecase/verify-email.usecase';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeEnvConfig, makeUser } from './fixtures';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { JwtService, Payload } from '@/shared/application/jwt/jwt.service';

describe('VerifyEmailUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'update'>>;
  let jwtService: jest.Mocked<JwtService>;
  let envConfigService: ReturnType<typeof makeEnvConfig>;
  let sut: VerifyEmailUseCase;

  const validPayload: Payload = { sub: 'user-1', username: 'joana', iat: 0, exp: 0 };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      generateJwt: jest.fn(),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn().mockResolvedValue(validPayload),
    };
    envConfigService = makeEnvConfig();

    sut = new VerifyEmailUseCase(
      userRepository as unknown as UserRepository,
      jwtService,
      envConfigService,
    );
  });

  it('should throw BadRequestError when the token is invalid or expired', async () => {
    jwtService.verifyJwt.mockResolvedValue(null);

    await expect(sut.execute({ token: 'bad-token' })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when the user from the token does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ token: 'token' })).rejects.toThrow(BadRequestError);
  });

  it('should mark the user email as verified and persist it', async () => {
    const user = makeUser({ id: 'user-1', emailVerified: false });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ token: 'token' });

    expect(user.emailVerified).toBe(true);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });

  it('should be a no-op (and not call update) when the email is already verified', async () => {
    const user = makeUser({ id: 'user-1', emailVerified: true });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ token: 'token' });

    expect(userRepository.update).not.toHaveBeenCalled();
  });
});
