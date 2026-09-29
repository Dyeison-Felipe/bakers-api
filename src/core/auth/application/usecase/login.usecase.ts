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
import { toSessionOutput } from '../helpers/session-output.helper';

type Input = LoginInput;

type Output = LoginOutput;

const PLAN_EXPIRED_EMPLOYEE_MESSAGE =
  'O plano da sua empresa expirou. Peça ao administrador da empresa para assinar um novo plano.';

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

    // Senha antes de qualquer outra regra: sem ela, as mensagens abaixo
    // (e-mail não verificado, plano vencido) revelariam que a conta existe.
    const comparePassword = this.hashService.compareHash(
      password,
      user.password,
    );

    if (!comparePassword) {
      throw new UnauthorizedError(`Usuário ou senha invalido`);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError(
        `Verifique seu e-mail antes de fazer login`,
      );
    }

    const session = toSessionOutput(user);

    // Plano vencido: só o Admin entra — e o guard só o deixa usar as rotas de
    // assinar um plano (@AllowExpiredPlan()) até pagar. Os demais usuários
    // continuam barrados aqui.
    if (session.company.planExpired && user.role !== 'Admin') {
      throw new PlanExpiredError(PLAN_EXPIRED_EMPLOYEE_MESSAGE);
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

    return { ...session, token };
  }
}
