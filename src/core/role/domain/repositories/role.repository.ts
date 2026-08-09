import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Role } from '../entities/role.entity';

export interface RoleRepository extends BaseRepository<Role> {
  findAllByCompany(companyId: string): Promise<Role[]>;
}
