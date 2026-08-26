import { Inject } from '@nestjs/common';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import type { HashService } from '@/shared/application/hash/hash.service';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { UpdateUserInput } from '@/shared/application/input/users/update-user.input';
import { UpdateUserOutput } from '@/shared/application/output/users/update-user.output';
import { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import { Role } from '@/core/role/domain/entities/role.entity';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';
import { Permission } from '@/core/permission/domain/entity/permission.entity';

type Input = UpdateUserInput;

type Output = UpdateUserOutput;

export class UpdateUserUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.USER_PERMISSION_REPOSITORY)
    private readonly userPermissionRepository: UserPermissionRepository,
    @Inject(PROVIDERS.PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(PROVIDERS.ROLE_REPOSITORY) private readonly roleRepository: RoleRepository
  ) { }

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    if (input.username !== user.username) {
      const existUsername = await this.userRepository.findByUsernameAndCompany(
        input.username,
        user.company.id,
      );

      if (existUsername && existUsername.id !== user.id) {
        throw new ConflictError(`Já existe um usuário com esse username`);
      }
    }

    if (loggedUser?.id === user.id && input.role !== user.role.id) {
      throw new BadRequestError(
        `Você não pode alterar o cargo do seu próprio usuário`,
      );
    }

    const role = await this.roleRepository.findById(input.role);

    if(!role) {
      throw new NotFoundError(`Cargo não encontrado`);
    }

    const permissions = await this.permissionRepository.findPermissionsById(
      input.permissionsId,
    );

    if (!permissions.length)
      throw new NotFoundError(`Permissão não encontrada`);

    if (input.password) {
      const hashNewPassword = await this.hashService.hash(input.password);
      user.updatePassword({ password: hashNewPassword });
    }

    user.update({
      username: input.username,
      name: input.name,
      email: input.email,
      role,
      updatedBy: loggedUser?.id ?? ID_USER_DEFAULT,
    });

    await this.updateUserPermission(permissions, user);

    await this.userRepository.update(user);

    const output = this.outputUser(user, role, permissions);

    return output;
  }

  outputUser(
    userEntity: UserEntity,
    role: Role,
    permissions: Permission[],
  ): Output {
    const output: Output = {
      id: userEntity.id,
      username: userEntity.username,
      name: userEntity.name,
      email: userEntity.email,
      role: { id: role.id, name: role.name },
      permissions: permissions.map((permission) => ({
        id: permission.id,
        action: permission.action,
        subject: permission.subject,
        description: permission.description,
      })),
    };

    return output;
  }

  async updateUserPermission(
    permissions: Permission[],
    user: UserEntity,
  ): Promise<UserPermissionEntity[]> {
    try {
      // permissões atuais
      const currentPermissions = user.userPermissions ?? [];

      // ids das permissões atuais
      const currentPermissionsId = currentPermissions.map(
        (up) => up.permission.id,
      );

      // id das novas permissões
      const newPermissionIds = permissions.map((p) => p.id);

      // permissões para adicionar
      const toAdd = permissions.filter(
        (p) => !currentPermissionsId.includes(p.id),
      );

      // permissões para remover
      const toRemove = currentPermissions.filter(
        (up) => !newPermissionIds.includes(up.permission.id),
      );

      if (toRemove.length) {
        await Promise.all(
          toRemove.map((up) => this.userPermissionRepository.softDelete(up.id)),
        );
      }

      const added = await Promise.all(
        toAdd.map((permission) => {
          const entity = UserPermissionEntity.create({ user, permission });
          return this.userPermissionRepository.create(entity);
        }),
      );

      const kept = currentPermissions.filter((up) =>
        newPermissionIds.includes(up.permission.id),
      );

      return [...kept, ...added];
    } catch (e) {
      throw new BadRequestError(
        `Ocorreu um erro ao salvar as permissões do usuário`,
      );
    }
  }
}
