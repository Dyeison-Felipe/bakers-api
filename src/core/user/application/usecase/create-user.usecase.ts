import { Inject } from '@nestjs/common';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import type { HashService } from '@/shared/application/hash/hash.service';
import { CreateUserInput } from '@/shared/application/input/users/create-user.input';
import { CreateUserOutput } from '@/shared/application/output/users/create-user.output';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';
import { Permission } from '@/core/permission/domain/entity/permission.entity';

type Input = CreateUserInput;

type Output = CreateUserOutput;

export class CreateUserUseCase implements UseCase<Input, Output> {
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
    @Inject(PROVIDERS.ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    

    const existUser = await this.userRepository.findByEmail(input.email);

    if (existUser) {
      throw new ConflictError(`E-mail invalido`);
    }

    const role = await this.roleRepository.findById(input.role);

    if (!role) {
      throw new NotFoundError(`Cargo não encontrado`);
    }

    const permissions = await this.permissionRepository.findPermissionsById(
      input.permissionsId,
    );

    if (!permissions.length)
      throw new NotFoundError(`Permissão não encontrada`);

    const hashedPassword = await this.hashService.hash(input.password);

    const userEntity = UserEntity.create({
      ...input,
      role,
      company: loggedUser.company,
      password: hashedPassword,
      createdBy: loggedUser?.id ?? ID_USER_DEFAULT,
      updatedBy: loggedUser?.id ?? ID_USER_DEFAULT,
    });

    const newUser = await this.userRepository.save(userEntity);

    await this.createUserPermission(
      permissions,
      newUser,
    );

    const output = this.outputUser(newUser);

    return output;
  }

  outputUser(
    userEntity: UserEntity,
  ): Output {
    const output: Output = {
      id: userEntity.id,
    };

    return output;
  }

  async createUserPermission(
    permissions: Permission[],
    user: UserEntity,
  ): Promise<UserPermissionEntity[]> {
    try {
      return await Promise.all(
        permissions.map((permission) => {
          const entity = UserPermissionEntity.create({ user, permission });
          return this.userPermissionRepository.create(entity);
        }),
      );
    } catch (e) {
      throw new BadRequestError(
        `Ocorreu um erro ao salvar as permissões do usuário`,
      );
    }
  }
}
