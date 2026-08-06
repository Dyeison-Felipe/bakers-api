import { UserQuery } from '@/core/user/application/queries/user.query';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CookieOptions } from '@/shared/application/cookies/cookies';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { HashService } from '@/shared/application/hash/hash.service';
import { LoginInput } from '@/shared/application/input/auth/login.input';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { LoginOutput } from '@/shared/application/output/auth/login.output';
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
  ) {}

  async execute({
    email,
    password,
    setCookie,
  }: LoginInput): Promise<LoginOutput> {
    const user = await this.useQuery.findUserByEmail(email);

    if (!user || !user.active) {
      throw new UnauthorizedError(`Usuário ou senha invalido`);
    }

    const comparePassword = this.hashService.compareHash(
      password,
      user.password,
    );

    if (!comparePassword) {
      throw new UnauthorizedError(`Usuário ou senha invalido`);
    }

    const { token } = await this.jwtService.generateJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
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

    const output: Output = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: (user?.permissions ?? []).map((permission) => ({
          id: permission.id,
          action: permission.action,
          subject: permission.subject,
          description: permission.description,
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
