import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSchema } from '../schema/user.schema';
import { FindOptionsRelations, Repository } from 'typeorm';
import { UserRepositoryMapper } from './mapper/user-mapper';
import { UserEntity } from '@/core/user/domain/entities/user.entity';

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
