import { LogoutUseCase } from '../usecase/logout.usecase';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { makeEnvConfig, makeUser } from './fixtures';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('LogoutUseCase', () => {
  let envConfig: ReturnType<typeof makeEnvConfig>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: LogoutUseCase;

  beforeEach(() => {
    envConfig = makeEnvConfig();
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new LogoutUseCase(envConfig, loggedUserService);
  });

  it('should clear the auth cookie with the configured cookie options', async () => {
    const clearCookie = jest.fn();

    await sut.execute({ clearCookie });

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
});
