import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { UserEntity } from '../entities/user.entity';
import { PermissionRef } from '@/core/auth/domain/permissions-definition/permissions';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';

export type UserLogin = UserEntity & {
  permissions: PermissionRef[];
};

export interface UserRepository extends BaseRepository<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdWithPermissions(id: string): Promise<UserEntity | null>;
  findByCode(code: string, email: string): Promise<UserEntity | null>
  findByUsernameAndCompany(username: string, companyId: string): Promise<UserEntity | null>;
  findAllByCompany(companyId: string, pagination?: PaginationInput): Promise<Pagination<UserEntity>>;
  countActiveByCompany(companyId: string): Promise<number>;
  updateActiveSession(userId: string, sessionId: string | null): Promise<void>;
}
