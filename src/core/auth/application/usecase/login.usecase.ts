import { UserQuery } from '@/core/user/application/queries/user.query';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CookieOptions } from '@/shared/application/cookies/cookies';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { PlanExpiredError } from '@/shared/application/errors/plan-expired-error';
import { SessionConflictError } from '@/shared/application/errors/session-conflict-error';
import { HashService } from '@/shared/application/hash/hash.service';
import { LoginInput } from '@/shared/application/input/auth/login.input';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { LoginOutput } from '@/shared/application/output/auth/login.output';
import { SessionNotifierService } from '@/shared/application/session/session-notifier.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';

type Input = LoginInput;

type Output = LoginOutput;

export class LoginUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.USER_QUERY)
    private readonly useQuery: UserQuery,
    @Inject(PROVIDERS.HASH_SERVICE) private readonly hashService: HashService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.SESSION_NOTIFIER_SERVICE)
    private readonly sessionNotifierService: SessionNotifierService,
  ) {}

  async execute({
    email,
    password,
    force,
    setCookie,
  }: LoginInput): Promise<LoginOutput> {
    const user = await this.useQuery.findUserByEmail(email);

    if (!user || !user.active) {
      throw new UnauthorizedError(`Usuário ou senha invalido`);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError(
        `Verifique seu e-mail antes de fazer login`,
      );
    }

    // Super Admin não está vinculado a um plano de verdade — nunca bloquear
    // por expiração.
    if (
      user.role !== 'Super Admin' &&
      (!user.company.active ||
        user.company.planExpiresAt.getTime() < Date.now())
    ) {
      throw new PlanExpiredError();
    }

    const comparePassword = this.hashService.compareHash(
      password,
      user.password,
    );

    if (!comparePassword) {
      throw new UnauthorizedError(`Usuário ou senha invalido`);
    }

    // Uma conta só pode estar logada em um navegador por vez. Se já existe
    // uma sessão ativa, exige confirmação explícita (force) antes de
    // derrubá-la — o front pergunta pro usuário antes de reenviar o login.
    if (user.activeSessionId && !force) {
      throw new SessionConflictError();
    }

    const previousSessionId = user.activeSessionId;
    const sessionId = crypto.randomUUID();

    await this.userRepository.updateActiveSession(user.id, sessionId);

    const { token } = await this.jwtService.generateJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      sessionId,
    });

    const jwtExpiresInSeconds = this.envConfigService.getJwtExpiresInSeconds();

    const options: CookieOptions = {
      httpOnly: true,
      maxAge: jwtExpiresInSeconds,
      path: '/',
      domain: this.envConfigService.getCookieDomain(),
      secure: this.envConfigService.getCookieSecure(),
      sameSite: this.envConfigService.getCookieSameSite(),
    };

    setCookie(AuthConstants.tokenName, token, options);

    if (previousSessionId) {
      this.sessionNotifierService.invalidateOtherSessions(user.id, sessionId);
    }

    const output: Output = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: (user?.permissions ?? []).map((permission) => ({
          action: permission.action,
          subject: permission.subject,
        })),
      },
      company: {
        id: user.company.id,
        cnpj: user.company.cnpj,
        stateRegistration: user.company.stateRegistration,
        fantasyName: user.company.fantasyName,
        socialReazon: user.company.socialReazon,
        plan: {
          id: user.company.plan?.id ?? '',
          name: user.company.plan?.name ?? '',
          permissions: (user.company.plan?.permissions ?? []).map(
            (permission) => ({
              action: permission.action,
              subject: permission.subject,
            }),
          ),
        },
      },
      token: token,
    };

    return output;
  }
}
