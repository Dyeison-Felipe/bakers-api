import { LoginUseCase } from '../usecase/login.usecase';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { makeEnvConfig } from './fixtures';
import type { UserQuery, UserByLogin } from '@/core/user/application/queries/user.query';
import type { HashService } from '@/shared/application/hash/hash.service';
import type { JwtService } from '@/shared/application/jwt/jwt.service';

const makeUserByLogin = (overrides: Partial<UserByLogin> = {}): UserByLogin => ({
  id: 'user-1',
  username: 'joana',
  password: 'hashed-password',
  email: 'joana@example.com',
  active: true,
  emailVerified: true,
  company: {
    id: 'company-1',
    cnpj: '12345678000190',
    stateRegistration: '123456',
    fantasyName: 'Padaria X',
    socialReazon: 'Padaria X LTDA',
    active: true,
    planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan: { id: 'plan-1', name: 'Básico', price: 0, duration: 30, permissions: [] },
  },
  role: 'Funcionário',
  permissions: [],
  ...overrides,
});

describe('LoginUseCase', () => {
  let jwtService: jest.Mocked<JwtService>;
  let userQuery: jest.Mocked<UserQuery>;
  let hashService: jest.Mocked<HashService>;
  let envConfigService: jest.Mocked<ReturnType<typeof makeEnvConfig>>;
  let setCookie: jest.Mock;
  let sut: LoginUseCase;

  beforeEach(() => {
    jwtService = {
      generateJwt: jest.fn().mockResolvedValue({ token: 'jwt-token' }),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn(),
    };
    userQuery = {
      findUserByEmail: jest.fn(),
      findUserGuardBySub: jest.fn(),
    };
    hashService = {
      hash: jest.fn(),
      compareHash: jest.fn().mockReturnValue(true),
    };
    envConfigService = makeEnvConfig();
    setCookie = jest.fn();

    sut = new LoginUseCase(jwtService, userQuery, hashService, envConfigService);
  });

  it('should throw UnauthorizedError when the user does not exist', async () => {
    userQuery.findUserByEmail.mockResolvedValue(null);

    await expect(
      sut.execute({ email: 'x@x.com', password: '123', setCookie }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when the user is inactive', async () => {
    userQuery.findUserByEmail.mockResolvedValue(makeUserByLogin({ active: false }));

    await expect(
      sut.execute({ email: 'x@x.com', password: '123', setCookie }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when the email is not verified', async () => {
    userQuery.findUserByEmail.mockResolvedValue(
      makeUserByLogin({ emailVerified: false }),
    );

    await expect(
      sut.execute({ email: 'x@x.com', password: '123', setCookie }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when the password does not match', async () => {
    userQuery.findUserByEmail.mockResolvedValue(makeUserByLogin());
    hashService.compareHash.mockReturnValue(false);

    await expect(
      sut.execute({ email: 'x@x.com', password: 'wrong', setCookie }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should set the auth cookie with the generated token on success', async () => {
    userQuery.findUserByEmail.mockResolvedValue(makeUserByLogin());

    await sut.execute({ email: 'joana@example.com', password: '123', setCookie });

    expect(setCookie).toHaveBeenCalledWith(
      AuthConstants.tokenName,
      'jwt-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should return only action/subject for permissions, without exposing ids', async () => {
    userQuery.findUserByEmail.mockResolvedValue(
      makeUserByLogin({
        permissions: [
          { id: 'perm-1', action: 'create', subject: 'sale', description: 'x' },
        ],
      }),
    );

    const output = await sut.execute({
      email: 'joana@example.com',
      password: '123',
      setCookie,
    });

    expect(output.user.permissions).toEqual([{ action: 'create', subject: 'sale' }]);
  });

  it('should return the company plan permissions as action/subject pairs too', async () => {
    userQuery.findUserByEmail.mockResolvedValue(
      makeUserByLogin({
        company: {
          ...makeUserByLogin().company,
          plan: {
            id: 'plan-1',
            name: 'Básico',
            price: 0,
            duration: 30,
            permissions: [
              { id: 'perm-1', action: 'reader', subject: 'sale', description: 'x' },
            ],
          },
        },
      }),
    );

    const output = await sut.execute({
      email: 'joana@example.com',
      password: '123',
      setCookie,
    });

    expect(output.company.plan.permissions).toEqual([
      { action: 'reader', subject: 'sale' },
    ]);
  });

  it('should default plan id/name to empty string when the company has no plan', async () => {
    userQuery.findUserByEmail.mockResolvedValue(
      makeUserByLogin({ company: { ...makeUserByLogin().company, plan: undefined } }),
    );

    const output = await sut.execute({
      email: 'joana@example.com',
      password: '123',
      setCookie,
    });

    expect(output.company.plan).toEqual({ id: '', name: '', permissions: [] });
  });
});
