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
import { Role } from '@/core/role/domain/entities/role.entity';
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

    const existUsername = await this.userRepository.findByUsernameAndCompany(
      input.username,
      loggedUser.company.id,
    );

    if (existUsername) {
      throw new ConflictError(`Já existe um usuário com esse username`);
    }

    const role = await this.roleRepository.findById(input.role);

    // Uma role só pode ser atribuída se pertencer à empresa do usuário logado
    // — sem esse check, o id (fixo, conhecido) da role "Super Admin" poderia
    // ser enviado diretamente na API para escalar privilégio. "Super Admin" é
    // reservada ao administrador master do sistema e nunca é atribuível aqui,
    // mesmo dentro da própria empresa dona dela.
    if (
      !role ||
      role.company?.id !== loggedUser.company.id ||
      role.name === 'Super Admin'
    ) {
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

    // Usuário criado por um admin já entra pronto pra uso — não passa pelo
    // fluxo de verificação de e-mail (esse só existe no cadastro público).
    userEntity.verifyEmail();

    const newUser = await this.userRepository.save(userEntity);

    await this.createUserPermission(
      permissions,
      newUser,
    );

    const output = this.outputUser(newUser, role, permissions);

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
