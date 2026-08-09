import { UpdateUserPasswordUseCase } from '../usecase/update-user-password.usecase';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeLoggedUser, makeUser } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { JwtService, Payload } from '@/shared/application/jwt/jwt.service';
import type { HashService } from '@/shared/application/hash/hash.service';

describe('UpdateUserPasswordUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'update'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let jwtService: jest.Mocked<JwtService>;
  let hashService: jest.Mocked<HashService>;
  let sut: UpdateUserPasswordUseCase;

  const validPayload: Payload = {
    sub: 'user-1',
    username: 'joana',
    iat: 0,
    exp: 0,
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn().mockResolvedValue(makeUser({ id: 'user-1' })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    jwtService = {
      generateJwt: jest.fn(),
      decodeJwt: jest.fn().mockReturnValue(validPayload),
      verifyJwt: jest.fn().mockResolvedValue(validPayload),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('new-hashed-password'),
      compareHash: jest.fn(),
    };

    sut = new UpdateUserPasswordUseCase(
      userRepository as unknown as UserRepository,
      loggedUserService,
      jwtService,
      hashService,
    );
  });

  it('should throw BadRequestError when the jwt is invalid', async () => {
    jwtService.verifyJwt.mockResolvedValue(null);

    await expect(
      sut.execute({ jwt: 'token', password: 'new-password' }),
    ).rejects.toThrow(BadRequestError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when the user from the jwt subject does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({ jwt: 'token', password: 'new-password' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should hash and persist the new password, then clear the reset code', async () => {
    const user = makeUser({ id: 'user-1', passwordResetCode: '123456' });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ jwt: 'token', password: 'new-password' });

    expect(hashService.hash).toHaveBeenCalledWith('new-password');
    expect(user.password).toBe('new-hashed-password');
    expect(user.passwordResetCode).toBeNull();
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });

  it('should look up the user by the jwt subject, not the currently logged user', async () => {
    jwtService.decodeJwt.mockReturnValue({ ...validPayload, sub: 'user-from-token' });

    await sut.execute({ jwt: 'token', password: 'new-password' });

    expect(userRepository.findById).toHaveBeenCalledWith('user-from-token');
  });
});
