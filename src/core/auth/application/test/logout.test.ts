import { LogoutUseCase } from '../usecase/logout.usecase';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { makeEnvConfig, makeUser } from './fixtures';
import type { JwtService } from '@/shared/application/jwt/jwt.service';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';

describe('LogoutUseCase', () => {
  let envConfig: ReturnType<typeof makeEnvConfig>;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'updateActiveSession'>>;
  let sut: LogoutUseCase;

  beforeEach(() => {
    envConfig = makeEnvConfig();
    jwtService = {
      generateJwt: jest.fn(),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn().mockResolvedValue(null),
    };
    userRepository = {
      findById: jest.fn(),
      updateActiveSession: jest.fn().mockResolvedValue(undefined),
    };

    sut = new LogoutUseCase(
      envConfig,
      jwtService,
      userRepository as unknown as UserRepository,
    );
  });

  it('should clear the auth cookie with the configured cookie options', async () => {
    const clearCookie = jest.fn();

    await sut.execute({ token: undefined, clearCookie });

    expect(clearCookie).toHaveBeenCalledWith(
      AuthConstants.tokenName,
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        domain: 'localhost',
        secure: false,
        sameSite: 'lax',
      }),
    );
  });

  it('should clear the active session when the token still matches the currently stored session', async () => {
    jwtService.verifyJwt.mockResolvedValue({
      sub: 'user-1',
      username: 'joana',
      sessionId: 'session-1',
      iat: 0,
      exp: 0,
    });
    userRepository.findById.mockResolvedValue(
      makeUser({ activeSessionId: 'session-1' }),
    );

    await sut.execute({ token: 'valid-token', clearCookie: jest.fn() });

    expect(userRepository.updateActiveSession).toHaveBeenCalledWith('user-1', null);
  });

  it('should not clear the session when the token session no longer matches the stored one (already replaced)', async () => {
    jwtService.verifyJwt.mockResolvedValue({
      sub: 'user-1',
      username: 'joana',
      sessionId: 'stale-session',
      iat: 0,
      exp: 0,
    });
    userRepository.findById.mockResolvedValue(
      makeUser({ activeSessionId: 'newer-session' }),
    );

    await sut.execute({ token: 'stale-token', clearCookie: jest.fn() });

    expect(userRepository.updateActiveSession).not.toHaveBeenCalled();
  });

  it('should not touch any session when there is no token', async () => {
    await sut.execute({ token: undefined, clearCookie: jest.fn() });

    expect(jwtService.verifyJwt).not.toHaveBeenCalled();
    expect(userRepository.updateActiveSession).not.toHaveBeenCalled();
  });
});
