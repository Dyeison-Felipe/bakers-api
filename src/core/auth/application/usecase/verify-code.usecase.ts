import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CookieOptions } from '@/shared/application/cookies/cookies';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { Inject } from '@nestjs/common';

type Input = {
  code: string;
  email: string;
  setCookie: (key: string, value: string, options?: CookieOptions) => void;
};

type Output = void;

export class VerifyCodeUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
  ) {}

  @Transactional()
  async execute({ code, email, setCookie }: Input): Promise<Output> {
    const user = await this.userRepository.findByCode(code, email);

    if (!user) {
      throw new BadRequestError(`Código incorreto`);
    }

    const now = new Date();

    if (
      user.expiredAtCode &&
      (user.passwordResetCode !== code || now > user.expiredAtCode)
    ) {
      throw new BadRequestError(`Código incorreto`);
    }

    user.updateResetPasswordCode();
    user.update({ ...user, updatedBy: ID_USER_DEFAULT });

    await this.userRepository.update(user);
    try {
      const { token } = await this.jwtService.generateJwt(
        {
          sub: user.id,
          email: user.email,
          role: user.role.name,
          username: user.username,
        },
        {
          secret: this.envConfigService.getJwtSecretForgotPassword(),
          expiresIn: this.envConfigService.getExpiresInSecondsForgotPassword(),
        },
      );

      const jwtExpiresInSeconds =
        this.envConfigService.getJwtExpiresInSeconds();

      const options: CookieOptions = {
        httpOnly: true,
        maxAge: jwtExpiresInSeconds,
        path: '/',
        domain: this.envConfigService.getCookieDomain(),
        secure: this.envConfigService.getCookieSecure(),
        sameSite: this.envConfigService.getCookieSameSite(),
      };

      setCookie(AuthConstants.tokenForgotPassword, token, options);
    } catch (e) {
      console.error('[VerifyCodeUseCase] falha ao gerar token/cookie:', e);
      throw new BadRequestError(`Ocorreu um erro ao verificar o código`);
    }
  }
}
