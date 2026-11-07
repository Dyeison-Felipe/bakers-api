import { PROVIDERS } from '@/shared/application/constants/providers';
import { FindAllPermissionsOutput } from '@/shared/application/output/permissions/find-all-permissions.output';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { isPlatformOnlyResource } from '@/core/auth/domain/permissions-definition/platform-permissions';
import { PermissionRepository } from '../../domain/repositories/permission.repository';
import { Inject } from '@nestjs/common';

type Input = void;

type Output = FindAllPermissionsOutput[];

const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

export class FindAllPermissionsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PERMISSION_REPOSITORY)
    private readonly resourceRepository: PermissionRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: void): Promise<Output> {
    const permissions = await this.resourceRepository.findAll();

    if (!permissions) return [];

    // Super Admin monta planos com a lista completa; o Admin de uma empresa
    // (tela de Usuários) não vê as permissões de plataforma (ex.: planos).
    const isSuperAdmin =
      this.loggedUserService.getLoggedUser()?.role?.name ===
      SUPER_ADMIN_ROLE_NAME;

    const visible = isSuperAdmin
      ? permissions
      : permissions.filter(
          (permission) => !isPlatformOnlyResource(permission.subject),
        );

    return visible.map((permission) => ({
      id: permission.id,
      action: permission.action,
      subject: permission.subject,
      description: permission.description,
    }));
  }
}
