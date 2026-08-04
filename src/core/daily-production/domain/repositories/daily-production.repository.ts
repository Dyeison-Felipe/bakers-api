import { BaseRepository } from '@/shared/domain/repository/base-repository';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProduction } from '../entities/daily-production.entity';

export type FindAllDailyProductionsFilters = {
  status?: TypeDailyProductionStatus;
  productionDate?: Date;
};

export interface DailyProductionRepository
  extends BaseRepository<DailyProduction> {
  update(entity: DailyProduction): Promise<void>;

  findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<DailyProduction | null>;

  findAllByCompanyId(
    companyId: string,
    filters?: FindAllDailyProductionsFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<DailyProduction>>;
}
