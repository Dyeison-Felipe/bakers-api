import { AuthConstants } from "@/shared/application/constants/auth-constants";
import { PROVIDERS } from "@/shared/application/constants/providers";
import { CookieOptions } from "@/shared/application/cookies/cookies";
import { EnvConfig } from "@/shared/application/env-config/env-config";
import { JwtService } from "@/shared/application/jwt/jwt.service";
import { LoggedUserService } from "@/shared/application/logged-user/logged-user.service";
import { UseCase } from "@/shared/application/usecase/usecase";
import { Transactional } from "@/shared/infra/database/typeorm/decorators/transactional.decorator";
import { Inject } from "@nestjs/common";

type Input = {
  clearCookie: (key: string, options: CookieOptions) => void;
};

type Output = void;

export class LogoutUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfig: EnvConfig,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute({ clearCookie }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();


    clearCookie(AuthConstants.tokenName, {
      httpOnly: true,
      maxAge: this.envConfig.getJwtExpiresInSeconds(),
      path: '/',
      domain: this.envConfig.getCookieDomain(),
      secure: this.envConfig.getCookieSecure(),
      sameSite: this.envConfig.getCookieSameSite(),
    });
  }
}