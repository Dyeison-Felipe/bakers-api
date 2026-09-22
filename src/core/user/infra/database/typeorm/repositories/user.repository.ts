import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSchema } from '../schema/user.schema';
import { FindOptionsRelations, Repository } from 'typeorm';
import { UserRepositoryMapper } from './mapper/user-mapper';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';
import { TtlCache } from '@/shared/infra/cache/ttl-cache';

// Cache do usuário carregado pelo PermissionGuard (uma leitura por requisição).
// Guarda o schema cru — cada leitura mapeia uma entidade nova, então nenhum
// chamador compartilha (nem muta) a mesma instância. TTL curto: mudanças em
// empresa/plano/role/permissões feitas por outros repositórios propagam em até
// 30 s; escritas de usuário invalidam na hora.
const AUTH_USER_CACHE_TTL_MS = 30_000;
const AUTH_USER_CACHE_MAX_ENTRIES = 500;

export class UserRepositoryImpl implements UserRepository {
  private static readonly authUserCache = new TtlCache<UserSchema>(
    AUTH_USER_CACHE_TTL_MS,
    AUTH_USER_CACHE_MAX_ENTRIES,
  );

  static clearAuthUserCache(): void {
    UserRepositoryImpl.authUserCache.clear();
  }

  constructor(
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<UserSchema>,
  ) {}

  async findByCode(code: string, email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { passwordResetCode: code, email },
      relations: this.getRelations(),
    });

    if (!user) return null;

    const userEntity = UserRepositoryMapper.toEntity(user);

    return userEntity;
  }

  async findByIdWithPermissions(id: string): Promise<UserEntity | null> {
    // Chamado pelo PermissionGuard em toda requisição autenticada. Com JOIN
    // único, `planPermission` × `userPermissions` (duas relações 1:N) gera
    // produto cartesiano; carregando cada relação em query própria o volume
    // trafegado cai de N×M linhas largas para N+M.
    const cached = UserRepositoryImpl.authUserCache.get(id);

    if (cached) return UserRepositoryMapper.toEntity(cached);

    const userSchema = await this.userRepository.findOne({
      where: { id },
      relations: this.getRelations(),
      relationLoadStrategy: 'query',
    });

    if (!userSchema) return null;

    UserRepositoryImpl.authUserCache.set(id, userSchema);

    const entity = UserRepositoryMapper.toEntity(userSchema);

    return entity;
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const userSchema = UserRepositoryMapper.toSchema(entity);

    const saveUser = await this.userRepository.save(userSchema);

    UserRepositoryImpl.authUserCache.delete(saveUser.id);

    const userEntity = UserRepositoryMapper.toEntity(saveUser);

    return userEntity;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const userSchema = await this.userRepository.findOne({
      where: { email },
      relations: this.getRelations(),
    });

    if (!userSchema) return null;

    const userEntity = UserRepositoryMapper.toEntity(userSchema);

    return userEntity;
  }

  async findByUsernameAndCompany(
    username: string,
    companyId: string,
  ): Promise<UserEntity | null> {
    const userSchema = await this.userRepository.findOne({
      where: { username, company: { id: companyId } },
      relations: this.getRelations(),
    });

    if (!userSchema) return null;

    const userEntity = UserRepositoryMapper.toEntity(userSchema);

    return userEntity;
  }

  async findAllByCompany(
    companyId: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<UserEntity>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const direction = pagination?.direction ?? 'DESC';

    const [usersSchema, totalItems] = await this.userRepository.findAndCount({
      where: { company: { id: companyId } },
      relations: this.getRelations(),
      order: { createdAt: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    const usersEntity = usersSchema.map((schema) =>
      UserRepositoryMapper.toEntity(schema),
    );

    return {
      items: usersEntity,
      meta: {
        totalItems,
        itemCount: usersEntity.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const userSchema = await this.userRepository.findOne({
      where: { id },
      relations: this.getRelations(),
    });

    if (!userSchema) return null;

    const userEntity = UserRepositoryMapper.toEntity(userSchema);

    return userEntity;
  }

  async update(entity: UserEntity): Promise<UserEntity> {
    const userSchema = UserRepositoryMapper.toSchema(entity);

    const saveUser = await this.userRepository.save(userSchema);

    UserRepositoryImpl.authUserCache.delete(saveUser.id);

    const userEntity = UserRepositoryMapper.toEntity(saveUser);

    return userEntity;
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);

    UserRepositoryImpl.authUserCache.delete(id);
  }

  async countActiveByCompany(companyId: string): Promise<number> {
    return this.userRepository.count({
      where: { company: { id: companyId }, active: true },
    });
  }

  async updateActiveSession(
    userId: string,
    sessionId: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { activeSessionId: sessionId });

    UserRepositoryImpl.authUserCache.delete(userId);
  }

  private getRelations(): FindOptionsRelations<UserSchema> {
    return {
      role: {
        company: true
      },
      company: {
        address: {
          city: {
            state: true,
          },
        },
        plan: {
          planPermission: {
            permission: true
          }
        },
      },
      userPermissions: {
        permission: true,
      },
    };
  }
}
