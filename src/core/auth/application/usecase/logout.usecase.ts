import { UserRepository } from "@/core/user/domain/repositories/user.repository";
import { AuthConstants } from "@/shared/application/constants/auth-constants";
import { PROVIDERS } from "@/shared/application/constants/providers";
import { CookieOptions } from "@/shared/application/cookies/cookies";
import { EnvConfig } from "@/shared/application/env-config/env-config";
import { JwtService } from "@/shared/application/jwt/jwt.service";
import { UseCase } from "@/shared/application/usecase/usecase";
import { Transactional } from "@/shared/infra/database/typeorm/decorators/transactional.decorator";
import { Inject } from "@nestjs/common";

type Input = {
  token: string | undefined;
  clearCookie: (key: string, options: CookieOptions) => void;
};

type Output = void;

export class LogoutUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfig: EnvConfig,
    @Inject(PROVIDERS.JWT_SERVICE)
    private readonly jwtService: JwtService,
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  @Transactional()
  async execute({ token, clearCookie }: Input): Promise<Output> {
    if (token) {
      const payload = await this.jwtService.verifyJwt(token);

      if (payload?.sessionId) {
        const user = await this.userRepository.findById(payload.sub);

        // Só limpa se ainda for a sessão atual — evita que uma aba já
        // derrubada por outro login apague por engano a sessão nova.
        if (user?.activeSessionId === payload.sessionId) {
          await this.userRepository.updateActiveSession(payload.sub, null);
        }
      }
    }

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
