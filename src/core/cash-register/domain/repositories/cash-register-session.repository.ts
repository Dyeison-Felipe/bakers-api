import { BaseRepository } from '@/shared/domain/repository/base-repository';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { CashRegisterSession } from '../entities/cash-register-session.entity';

export type FindAllCashRegisterSessionsFilters = {
  dateFrom?: Date;
  dateTo?: Date;
};

export interface CashRegisterSessionRepository
  extends BaseRepository<CashRegisterSession> {
  update(entity: CashRegisterSession): Promise<void>;

  findOpenByCompanyId(
    companyId: string,
  ): Promise<CashRegisterSession | null>;

  findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CashRegisterSession | null>;

  findAllByCompanyId(
    companyId: string,
    filters?: FindAllCashRegisterSessionsFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<CashRegisterSession>>;

  findAllByCompanyIdAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<CashRegisterSession[]>;
}
