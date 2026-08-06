import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { Inject } from '@nestjs/common';

type Input = {
  token: string;
};

type Output = void;

export class VerifyEmailUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
  ) {}

  @Transactional()
  async execute({ token }: Input): Promise<Output> {
    const payload = await this.jwtService.verifyJwt(token, {
      secret: this.envConfigService.getJwtSecretEmailVerification(),
    });

    if (!payload) {
      throw new BadRequestError('Link de verificação inválido ou expirado');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new BadRequestError('Link de verificação inválido ou expirado');
    }

    if (user.emailVerified) {
      return;
    }

    user.verifyEmail();
    user.update({ ...user, updatedBy: ID_USER_DEFAULT });

    await this.userRepository.update(user);
  }
}
