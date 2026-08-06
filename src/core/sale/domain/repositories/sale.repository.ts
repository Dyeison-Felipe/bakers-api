import { BaseRepository } from '@/shared/domain/repository/base-repository';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { Sale } from '../entities/sale.entity';

export type FindAllSalesFilters = {
  cashRegisterSessionId?: string;
};

export interface SaleRepository extends BaseRepository<Sale> {
  update(entity: Sale): Promise<void>;

  findByIdAndCompanyId(id: string, companyId: string): Promise<Sale | null>;

  findAllByCompanyId(
    companyId: string,
    filters?: FindAllSalesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Sale>>;

  sumTotalByCashRegisterSessionAndPaymentMethod(
    cashRegisterSessionId: string,
    paymentMethod: TypePaymentMethod,
  ): Promise<number>;

  sumTotalByCompanyAndDateRangeAndPaymentMethod(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    paymentMethod: TypePaymentMethod,
  ): Promise<number>;
}
