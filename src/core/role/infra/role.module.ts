import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleSchema } from './database/typeorm/schema/role.schema';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { RoleRepositoryImpl } from './database/typeorm/repository/role.repository';
import { RoleRepository } from '../domain/repositories/role.repository';
import { RoleController } from './controllers/role.controller';
import { FindAllRolesUseCase } from '../application/usecase/find-all-roles.usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoleSchema])],
  controllers: [RoleController],
  providers: [
    {
      provide: PROVIDERS.ROLE_REPOSITORY,
      useClass: RoleRepositoryImpl,
    },
    {
      provide: FindAllRolesUseCase,
      useFactory: (
        roleRepository: RoleRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllRolesUseCase(roleRepository, loggedUserService);
      },
      inject: [PROVIDERS.ROLE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [PROVIDERS.ROLE_REPOSITORY],
})
export class RoleModule {}
