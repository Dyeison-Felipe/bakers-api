import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { HashService } from '@/shared/application/hash/hash.service';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { MailService } from '@/shared/application/mail/mail.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { Inject } from '@nestjs/common';
import { randomInt } from 'crypto';

type Input = {
  email: string;
};

type Output = void;

export class ForgotPasswordUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.MAIL_SERVICE) private readonly mailService: MailService,
  ) {}

  @Transactional()
  async execute({ email }: Input): Promise<Output> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestError(
        `Se este email estiver cadastrado, você receberá o código em breve.`,
      );
    }

    try {
      const code = randomInt(100000, 999999).toString();
      user.updateResetPasswordCode(code);
      user.update({...user, updatedBy: ID_USER_DEFAULT})
      await this.userRepository.update(user);

      const expiresAt = user.expiredAtCode!.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });

      await this.mailService.sendMail({
        to: user.email,
        template: 'forgot-password',
        subject: 'Código de recuperação de senha',
        context: {
          name: user.username,
          code: code,
          expiresAt,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      throw new BadRequestError(
        `Se este email estiver cadastrado, você receberá o código em breve.`,
      );
    }
  }
}
