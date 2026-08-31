import { ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from '../permission.guard';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { ForbiddenError } from '@/shared/application/errors/forbidden-error';
import { PlanExpiredError } from '@/shared/application/errors/plan-expired-error';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import {
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  SUPER_ADMIN_ONLY_KEY,
} from '@/shared/infra/decorators/permission.decorator';
import type { JwtService } from '@/shared/application/jwt/jwt.service';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { UserEntity } from '@/core/user/domain/entities/user.entity';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { CaslAbilityService } from '../../service/casl-ability.service';
import type { Reflector } from '@nestjs/core';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  active: true,
  expiredAtCode: null,
  role: { name: 'Funcionário' },
  userPermissions: [],
  company: {
    active: true,
    planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan: { permissions: [{ action: 'reader', subject: 'product' }] },
  },
  ...overrides,
} as unknown as UserEntity);

describe('PermissionGuard', () => {
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: { findByIdWithPermissions: jest.Mock };
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let caslAbilityService: jest.Mocked<CaslAbilityService>;
  let reflectorAnswers: Record<string, unknown>;
  let reflector: { getAllAndOverride: jest.Mock };
  let sut: PermissionGuard;

  const makeContext = (
    cookies: Record<string, string> = { [AuthConstants.tokenName]: 'valid-token' },
  ) => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies, user: undefined }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = {
      generateJwt: jest.fn(),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn().mockResolvedValue({ sub: 'user-1', username: 'joana', iat: 0, exp: 0 }),
    };
    userRepository = {
      findByIdWithPermissions: jest.fn().mockResolvedValue(makeUser()),
    };
    loggedUserService = {
      getLoggedUser: jest.fn(),
      setLoggedUser: jest.fn(),
    };
    caslAbilityService = {
      ability: undefined as never,
      createForUser: jest.fn().mockReturnValue({ can: jest.fn().mockReturnValue(true) }),
    };
    reflectorAnswers = {
      [IS_PUBLIC_KEY]: false,
      [SUPER_ADMIN_ONLY_KEY]: false,
      [PERMISSIONS_KEY]: undefined,
    };
    reflector = {
      getAllAndOverride: jest.fn((key: string) => reflectorAnswers[key]),
    };

    sut = new PermissionGuard(
      jwtService,
      userRepository as unknown as UserRepository,
      loggedUserService,
      caslAbilityService as unknown as CaslAbilityService,
      reflector as unknown as Reflector,
    );
  });

  it('allows public routes without checking the token', async () => {
    reflectorAnswers[IS_PUBLIC_KEY] = true;

    await expect(sut.canActivate(makeContext({}))).resolves.toBe(true);
    expect(jwtService.verifyJwt).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when there is no token', async () => {
    await expect(sut.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the user is inactive', async () => {
    userRepository.findByIdWithPermissions.mockResolvedValue(makeUser({ active: false }));

    await expect(sut.canActivate(makeContext())).rejects.toThrow(UnauthorizedError);
  });

  it('allows a Super Admin on a @SuperAdminOnly() route', async () => {
    reflectorAnswers[SUPER_ADMIN_ONLY_KEY] = true;
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({ role: { name: 'Super Admin' } }),
    );

    await expect(sut.canActivate(makeContext())).resolves.toBe(true);
  });

  it('forbids a Super Admin on a regular (non @SuperAdminOnly()) route', async () => {
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({ role: { name: 'Super Admin' } }),
    );

    await expect(sut.canActivate(makeContext())).rejects.toThrow(ForbiddenError);
  });

  it('forbids a regular user on a @SuperAdminOnly() route', async () => {
    reflectorAnswers[SUPER_ADMIN_ONLY_KEY] = true;

    await expect(sut.canActivate(makeContext())).rejects.toThrow(ForbiddenError);
  });

  it('throws PlanExpiredError when the company plan has expired', async () => {
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({
        company: {
          active: true,
          planExpiresAt: new Date(Date.now() - 1000),
          plan: { permissions: [] },
        },
      }),
    );

    await expect(sut.canActivate(makeContext())).rejects.toThrow(PlanExpiredError);
  });

  it('throws PlanExpiredError when the company was deactivated', async () => {
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({
        company: {
          active: false,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          plan: { permissions: [] },
        },
      }),
    );

    await expect(sut.canActivate(makeContext())).rejects.toThrow(PlanExpiredError);
  });

  it('does not block a Super Admin even if their company plan looks expired', async () => {
    reflectorAnswers[SUPER_ADMIN_ONLY_KEY] = true;
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({
        role: { name: 'Super Admin' },
        company: {
          active: false,
          planExpiresAt: new Date(Date.now() - 1000),
          plan: { permissions: [] },
        },
      }),
    );

    await expect(sut.canActivate(makeContext())).resolves.toBe(true);
  });

  it('allows the request when the route has no required permissions', async () => {
    await expect(sut.canActivate(makeContext())).resolves.toBe(true);
  });

  it('forbids when the required permission is not included in the company plan', async () => {
    reflectorAnswers[PERMISSIONS_KEY] = [{ action: 'update', resource: 'product' }];
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({ company: { active: true, planExpiresAt: new Date(Date.now() + 1000), plan: { permissions: [] } } }),
    );

    await expect(sut.canActivate(makeContext())).rejects.toThrow(ForbiddenError);
  });

  it('allows an Admin as long as the permission is included in the plan, regardless of individual grants', async () => {
    reflectorAnswers[PERMISSIONS_KEY] = [{ action: 'reader', resource: 'product' }];
    userRepository.findByIdWithPermissions.mockResolvedValue(
      makeUser({ role: { name: 'Admin' } }),
    );

    await expect(sut.canActivate(makeContext())).resolves.toBe(true);
    expect(caslAbilityService.createForUser).not.toHaveBeenCalled();
  });

  it('forbids a regular user when CASL denies the individually-granted permission', async () => {
    reflectorAnswers[PERMISSIONS_KEY] = [{ action: 'reader', resource: 'product' }];
    caslAbilityService.createForUser.mockReturnValue({ can: jest.fn().mockReturnValue(false) } as never);

    await expect(sut.canActivate(makeContext())).rejects.toThrow(ForbiddenError);
  });

  it('allows a regular user when CASL grants the individually-granted permission', async () => {
    reflectorAnswers[PERMISSIONS_KEY] = [{ action: 'reader', resource: 'product' }];

    await expect(sut.canActivate(makeContext())).resolves.toBe(true);
  });
});
