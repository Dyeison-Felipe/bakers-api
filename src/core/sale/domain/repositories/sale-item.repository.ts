import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { SaleItem } from '../entities/sale-item.entity';

export type SalesCostSummary = {
  totalRevenue: number;
  totalCost: number;
};

export interface SaleItemRepository extends BaseRepository<SaleItem> {
  saveMany(entities: SaleItem[]): Promise<SaleItem[]>;

  findAllBySaleId(saleId: string): Promise<SaleItem[]>;

  sumRevenueAndCostByCompanyAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<SalesCostSummary>;

  sumRevenueAndCostByCashRegisterSessionId(
    cashRegisterSessionId: string,
  ): Promise<SalesCostSummary>;
}
