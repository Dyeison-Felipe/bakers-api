import { Global, Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UserRepositoryImpl } from './database/typeorm/repositories/user.repository';
import { HashModule } from '@/shared/infra/hash/hash.module';
import { CreateUserUseCase } from '../application/usecase/create-user.usecase';
import { UserRepository } from '../domain/repositories/user.repository';
import { HashService } from '@/shared/application/hash/hash.service';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './database/typeorm/schema/user.schema';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { UpdateUserUseCase } from '../application/usecase/update-user.usecase';
import { InactivateUserUseCase } from '../application/usecase/inactivate-user.usecase';
import { UpdateUserPasswordUseCase } from '../application/usecase/update-user-password.usecase';
import { FindAllUsersUseCase } from '../application/usecase/find-all-users.usecase';
import { FindUserByIdUseCase } from '../application/usecase/find-user-by-id.usecase';
import { JwtConfigModule } from '@/shared/infra/jwt/jwt.module';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { RoleModule } from '@/core/role/infra/role.module';
import { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import { UserQueryImpl } from './database/queries/user.query';
import { PermissionModule } from '@/core/permission/infra/permission.module';
import { UserPermissionModule } from '@/core/user-permission/infra/user-permission.module';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),
    HashModule,
    PermissionModule,
    UserPermissionModule,
    JwtConfigModule,
    RoleModule,
  ],
  controllers: [UserController],
  providers: [
    {
      provide: PROVIDERS.USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
    {
      provide: PROVIDERS.USER_QUERY,
      useClass: UserQueryImpl,
    },
    {
      provide: CreateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashService: HashService,
        loggedUserService: LoggedUserService,
        userPermissionRepository: UserPermissionRepository,
        permissionRepository: PermissionRepository,
        roleRepository: RoleRepository,
      ) => {
        return new CreateUserUseCase(
          userRepository,
          hashService,
          loggedUserService,
          userPermissionRepository,
          permissionRepository,
          roleRepository,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.HASH_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.USER_PERMISSION_REPOSITORY,
        PROVIDERS.PERMISSION_REPOSITORY,
        PROVIDERS.ROLE_REPOSITORY,
      ],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashService: HashService,
        loggedUserService: LoggedUserService,
        userPermissionRepository: UserPermissionRepository,
        permissionRepository: PermissionRepository,
        roleRepository: RoleRepository,
      ) => {
        return new UpdateUserUseCase(
          userRepository,
          hashService,
          loggedUserService,
          userPermissionRepository,
          permissionRepository,
          roleRepository,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.HASH_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.USER_PERMISSION_REPOSITORY,
        PROVIDERS.PERMISSION_REPOSITORY,
        PROVIDERS.ROLE_REPOSITORY,
      ],
    },
    {
      provide: InactivateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new InactivateUserUseCase(userRepository, loggedUserService);
      },
      inject: [PROVIDERS.USER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: UpdateUserPasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        loggedUserService: LoggedUserService,
        jwtService: JwtService,
        hashService: HashService,
      ) => {
        return new UpdateUserPasswordUseCase(
          userRepository,
          loggedUserService,
          jwtService,
          hashService,
        );
      },
      inject: [
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.HASH_SERVICE,
      ],
    },
    {
      provide: FindAllUsersUseCase,
      useFactory: (
        userRepository: UserRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllUsersUseCase(userRepository, loggedUserService);
      },
      inject: [PROVIDERS.USER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindUserByIdUseCase,
      useFactory: (
        userRepository: UserRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindUserByIdUseCase(userRepository, loggedUserService);
      },
      inject: [PROVIDERS.USER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [PROVIDERS.USER_REPOSITORY, PROVIDERS.USER_QUERY],
})
export class UserModule {}
