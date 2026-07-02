import { InjectRepository } from '@nestjs/typeorm';
import { UserPermissionSchema } from '../schema/user-permission.schema';
import { Repository } from 'typeorm';
import { UserPermissionRepositoryMapper } from './mapper/user-permission-repository.mapper';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';

export class UserPermissionRepositoryImpl implements UserPermissionRepository {
  constructor(
    @InjectRepository(UserPermissionSchema)
    private readonly userPermissionRepository: Repository<UserPermissionSchema>,
  ) {}

  async saveMany(entities: UserPermissionEntity[]): Promise<UserPermissionEntity[]> {
    const schemas = entities.map((entity) =>
      UserPermissionRepositoryMapper.toSchema(entity),
    );

    const save = await this.userPermissionRepository.save(schemas);

    return save.map((userPermissionSchema) =>
      UserPermissionRepositoryMapper.toEntity(userPermissionSchema),
    );
  }

  async create(entity: UserPermissionEntity): Promise<UserPermissionEntity> {
    const userPermissionSchema =
      UserPermissionRepositoryMapper.toSchema(entity);

    const save = await this.userPermissionRepository.save(userPermissionSchema);

    const userPermissionEntity = UserPermissionRepositoryMapper.toEntity(save);

    return userPermissionEntity;
  }

  async findAllPermissionByUser(
    userId: string,
  ): Promise<UserPermissionEntity[]> {
    const userPermissions = await this.userPermissionRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'permission'],
    });

    const userPermissionEntity = userPermissions.map((userPermission) =>
      UserPermissionRepositoryMapper.toEntity(userPermission),
    );

    return userPermissionEntity;
  }

  async softDelete(id: string): Promise<void> {
    await this.userPermissionRepository.softDelete(id);
  }
}
