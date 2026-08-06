import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { PlanPermission } from '../entity/plan-permission.entity';

export interface PlanPermissionRepository extends BaseRepository<PlanPermission> {
  saveMany(entities: PlanPermission[]): Promise<PlanPermission[]>;
  findAllPlansAndPermissions(): Promise<PlanPermission[]>;
  deleteAllByPlanId(planId: string): Promise<void>;
}
