import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { PermissionRepositoryImpl } from './database/typeorm/repositories/permission.repository';
import { PermissionMappper } from './database/typeorm/repositories/mapper/permission.mapper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSchema } from './database/typeorm/schema/permission.schema';
import { FindAllPermissionsUseCase } from '../application/usecase/find-all-permissions';
import { PermissionRepository } from '../domain/repositories/permission.repository';
import { PermissionController } from './controllers/permission.controller';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionSchema])],
  controllers: [PermissionController],
  providers: [
    {
      provide: PROVIDERS.PERMISSION_REPOSITORY,
      useClass: PermissionRepositoryImpl,
    },
    {
      provide: FindAllPermissionsUseCase,
      useFactory: (
        permissionRepository: PermissionRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllPermissionsUseCase(
          permissionRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.PERMISSION_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [PROVIDERS.PERMISSION_REPOSITORY],
})
export class PermissionModule {}
