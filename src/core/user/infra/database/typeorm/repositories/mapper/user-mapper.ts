import { Injectable } from '@nestjs/common';
import { UserSchema } from '../../schema/user.schema';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { RoleRepositoryMapper } from '@/core/role/infra/database/typeorm/repository/role.mapper';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { UserPermissionRepositoryMapper } from '@/core/user-permission/infra/database/typeorm/repositories/mapper/user-permission-repository.mapper';

@Injectable()
export class UserRepositoryMapper {
  static toEntity(schema: UserSchema): UserEntity {
    return new UserEntity({
      id: schema.id,
      username: schema.username,
      password: schema.password,
      active: schema.active,
      email: schema.email,
      emailVerified: schema.emailVerified,
      emailVerifiedAt: schema.emailVerifiedAt,
      expiredAtCode: schema.expiredAtCode,
      passwordResetCode: schema.passwordResetCode,
      role: RoleRepositoryMapper.toEntity(schema.role),
      company: CompanyRepositoryMapper.toEntity(schema.company),
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
      userPermissions: (schema?.userPermissions ?? []).map(
        UserPermissionRepositoryMapper.toEntity,
      ),
    });
  }
  static toSchema(entity: UserEntity): UserSchema {
    return UserSchema.with({
      id: entity.id,
      username: entity.username,
      password: entity.password,
      active: entity.active,
      email: entity.email,
      emailVerified: entity.emailVerified,
      emailVerifiedAt: entity.emailVerifiedAt ?? null,
      expiredAtCode: entity.expiredAtCode,
      passwordResetCode: entity.passwordResetCode ?? null,
      role: RoleRepositoryMapper.toSchema(entity.role),
      company: CompanyRepositoryMapper.toSchema(entity.company),
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
    });
  }
}
