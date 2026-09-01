import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSchema } from '../schema/user.schema';
import { FindOptionsRelations, Repository } from 'typeorm';
import { UserRepositoryMapper } from './mapper/user-mapper';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';

export class UserRepositoryImpl implements UserRepository {
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
    const userSchema = await this.userRepository.findOne({
      where: { id },
      relations: this.getRelations(),
    });

    if (!userSchema) return null;

    const entity = UserRepositoryMapper.toEntity(userSchema);

    return entity;
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const userSchema = UserRepositoryMapper.toSchema(entity);

    const saveUser = await this.userRepository.save(userSchema);

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

    const userEntity = UserRepositoryMapper.toEntity(saveUser);

    return userEntity;
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
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
