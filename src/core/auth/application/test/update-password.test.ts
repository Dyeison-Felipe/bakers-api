import { UpdatePasswordUseCase } from '../usecase/update-password.usecase';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { makeEnvConfig, makeUser } from './fixtures';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { HashService } from '@/shared/application/hash/hash.service';
import type { JwtService, Payload } from '@/shared/application/jwt/jwt.service';
import type { FastifyRequest } from 'fastify';

const makeRequest = (cookies: Record<string, string> = {}): FastifyRequest =>
  ({ cookies }) as unknown as FastifyRequest;

describe('UpdatePasswordUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'update'>>;
  let hashService: jest.Mocked<HashService>;
  let jwtService: jest.Mocked<JwtService>;
  let envConfigService: ReturnType<typeof makeEnvConfig>;
  let sut: UpdatePasswordUseCase;

  const validPayload: Payload = { sub: 'user-1', username: 'joana', iat: 0, exp: 0 };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('new-hashed-password'),
      compareHash: jest.fn(),
    };
    jwtService = {
      generateJwt: jest.fn(),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn().mockResolvedValue(validPayload),
    };
    envConfigService = makeEnvConfig();

    sut = new UpdatePasswordUseCase(
      userRepository as unknown as UserRepository,
      hashService,
      jwtService,
      envConfigService,
    );
  });

  it('should throw BadRequestError when there is no forgot-password cookie', async () => {
    await expect(
      sut.execute({ password: 'new-password', req: makeRequest() }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the token is invalid', async () => {
    jwtService.verifyJwt.mockResolvedValue(null);

    await expect(
      sut.execute({
        password: 'new-password',
        req: makeRequest({ [AuthConstants.tokenForgotPassword]: 'token' }),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the user from the token does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({
        password: 'new-password',
        req: makeRequest({ [AuthConstants.tokenForgotPassword]: 'token' }),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should hash and persist the new password on success', async () => {
    const user = makeUser({ id: 'user-1' });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({
      password: 'new-password',
      req: makeRequest({ [AuthConstants.tokenForgotPassword]: 'token' }),
    });

    expect(hashService.hash).toHaveBeenCalledWith('new-password');
    expect(user.password).toBe('new-hashed-password');
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });
});
