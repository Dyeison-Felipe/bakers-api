import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { SaleItem } from '../entities/sale-item.entity';

export type SalesCostSummary = {
  totalRevenue: number;
  totalCost: number;
};

export type ProductRevenueAndCost = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
};

export type TopSoldProduct = {
  productId: string;
  productName: string;
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantitySold: number;
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

  /** Receita e custo (CPV) agregados por produto vendido no período — base
   * para os relatórios de CPV, Margem de Contribuição e Curva ABC. Só
   * considera itens com produto vinculado (ignora vendas de produto já
   * excluído, que não têm mais um id agrupável). */
  findRevenueAndCostByProductAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ProductRevenueAndCost[]>;

  /** Produtos mais vendidos no período (soma de quantidade em un ou kg),
   * em ordem decrescente, limitados a `limit`. Ignora itens sem produto
   * vinculado (produto já excluído). */
  findTopSoldByCompanyAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
  ): Promise<TopSoldProduct[]>;
}
