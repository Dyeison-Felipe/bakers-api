import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { AdditionalCost } from '../entities/additional-cost.entity';

export interface AdditionalCostRepository extends BaseRepository<AdditionalCost> {
  findById(id: string): Promise<AdditionalCost | null>;
  findAllByCompanyId(companyId: string): Promise<AdditionalCost[]>;
  findAllByIdsAndCompanyId(ids: string[], companyId: string): Promise<AdditionalCost[]>;
}
