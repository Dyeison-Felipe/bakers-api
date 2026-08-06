import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CookieOptions } from '@/shared/application/cookies/cookies';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { HashService } from '@/shared/application/hash/hash.service';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { Inject } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

type Input = {
  password: string;
  req: FastifyRequest;
};

type Output = void;

export class UpdatePasswordUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.HASH_SERVICE) private readonly hashService: HashService,
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
  ) {}

  @Transactional()
  async execute({ password, req }: Input): Promise<Output> {
    try {
      const token = req.cookies[AuthConstants.tokenForgotPassword];

      if (!token)
        throw new BadRequestError(`Ocorreu um erro ao trocar a senha.`);

      const payload = await this.jwtService.verifyJwt(token, {
        secret: this.envConfigService.getJwtSecretForgotPassword(),
      });

      if (!payload) {
        throw new BadRequestError(`Ocorreu um erro ao trocar a senha.`);
      }

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new NotFoundError(`Usuário não encontrado`);
      }

      const hashNewPassword = await this.hashService.hash(password);

      user.updatePassword({
        password: hashNewPassword,
        updatedBy: ID_USER_DEFAULT,
      });

      await this.userRepository.update(user);
    } catch (e) {
      throw new BadRequestError(`Ocorreu um erro ao trocar a senha.`);
    }
  }
}
