import { BaseRepository } from '@/shared/domain/repository/base-repository';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { Batch } from '../entities/batch.entity';

export type FindAllBatchesFilters = {
  productId?: string;
  onlyAvailable?: boolean;
  producedOn?: Date;
};

export interface BatchRepository extends BaseRepository<Batch> {
  update(entity: Batch): Promise<void>;

  findByIdAndCompanyId(id: string, companyId: string): Promise<Batch | null>;

  findAllByCompanyId(
    companyId: string,
    filters?: FindAllBatchesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Batch>>;

  findAvailableByProductIdOrderByExpiration(
    productId: string,
    companyId: string,
  ): Promise<Batch[]>;
}
