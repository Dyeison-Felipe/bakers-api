import { Global, Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { LoginUseCase } from '../application/usecase/login.usecase';
import { UserModule } from '@/core/user/infra/user.module';
import { HashModule } from '@/shared/infra/hash/hash.module';
import { JwtConfigModule } from '@/shared/infra/jwt/jwt.module';
import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { HashService } from '@/shared/application/hash/hash.service';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CaslAbilityService } from './service/casl-ability.service';
import { PermissionGuard } from './guard/permission.guard';
import { ForgotPasswordUseCase } from '../application/usecase/forgot-password.usecase';
import { MailService } from '@/shared/application/mail/mail.service';
import { VerifyCodeUseCase } from '../application/usecase/verify-code.usecase';
import { UpdatePasswordUseCase } from '../application/usecase/update-password.usecase';
import { UserQuery } from '@/core/user/application/queries/user.query';
import { LogoutUseCase } from '../application/usecase/logout.usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { VerifyEmailUseCase } from '../application/usecase/verify-email.usecase';

@Global()
@Module({
  imports: [UserModule, HashModule, JwtConfigModule, EnvConfigModule],
  controllers: [AuthController],
  providers: [
    PermissionGuard,
    { provide: PROVIDERS.CASL_ABILITY_SERVICE, useClass: CaslAbilityService },
    {
      provide: LoginUseCase,
      useFactory: (
        jwtService: JwtService,
        userQuery: UserQuery,
        hasService: HashService,
        envConfigService: EnvConfig,
      ) => {
        return new LoginUseCase(
          jwtService,
          userQuery,
          hasService,
          envConfigService,
        );
      },
      inject: [
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.USER_QUERY,
        PROVIDERS.HASH_SERVICE,
        PROVIDERS.ENV_CONFIG_SERVICE,
      ],
    },
    {
      provide: ForgotPasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        mailService: MailService,
      ) => {
        return new ForgotPasswordUseCase(userRepository, mailService);
      },
      inject: [PROVIDERS.USER_REPOSITORY, PROVIDERS.MAIL_SERVICE],
    },
    {
      provide: VerifyCodeUseCase,
      useFactory: (
        userRepository: UserRepository,
        jwtService: JwtService,
        envConfigService: EnvConfig,
      ) => {
        return new VerifyCodeUseCase(
          userRepository,
          jwtService,
          envConfigService,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.ENV_CONFIG_SERVICE,
      ],
    },
    {
      provide: UpdatePasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashService: HashService,
        jwtService: JwtService,
        envConfigService: EnvConfig,
      ) => {
        return new UpdatePasswordUseCase(
          userRepository,
          hashService,
          jwtService,
          envConfigService,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.HASH_SERVICE,
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.ENV_CONFIG_SERVICE,
      ],
    },
    {
      provide: LogoutUseCase,
      useFactory: (
        envConfig: EnvConfig,
        loggedUserService: LoggedUserService,
      ) => {
        return new LogoutUseCase(envConfig, loggedUserService);
      },
      inject: [PROVIDERS.ENV_CONFIG_SERVICE, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (
        userRepository: UserRepository,
        jwtService: JwtService,
        envConfigService: EnvConfig,
      ) => {
        return new VerifyEmailUseCase(
          userRepository,
          jwtService,
          envConfigService,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.ENV_CONFIG_SERVICE,
      ],
    },
  ],
  exports: [PROVIDERS.CASL_ABILITY_SERVICE],
})
export class AuthModule {}
