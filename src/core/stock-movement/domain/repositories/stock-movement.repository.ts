import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeStockMovement, TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeConsumptionUnit, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';
import { StockMovement } from '../entities/stock-movement.entity';

export type StockMovementReportItem = {
  id: string;
  createdAt: Date;
  productId: string;
  productName: string;
  quantity: number;
  // Matéria-prima não tem unidade de venda: a unidade dela é a de consumo.
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  consumerUnit: TypeConsumptionUnit | null;
  unitCostSnapshot: number | null;
  totalCost: number;
  type: TypeStockMovement;
  reason: TypeStockMovementReason;
  reasonDescription: string | null;
};

export type ProductLastEntryDate = {
  productId: string;
  lastEntryDate: Date;
};

// Janela de tempo identificada por uma chave (ex.: id da sessão de caixa).
export type StockMovementTimeWindow = {
  id: string;
  dateFrom: Date;
  dateTo: Date;
};

export interface StockMovementRepository extends BaseRepository<StockMovement> {
  sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
  ): Promise<number>;

  /** Versão em lote de `sumUnitCostByCompanyAndDateAndReason`: uma query para
   * várias janelas de tempo. Janela sem movimentos não aparece no Map. */
  sumUnitCostByCompanyAndWindowsAndReason(
    companyId: string,
    windows: StockMovementTimeWindow[],
    reasons: TypeStockMovementReason[],
  ): Promise<Map<string, number>>;

  findAllByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
    filters?: ReportProductFilters,
  ): Promise<StockMovementReportItem[]>;

  /** Data da última entrada de estoque (type=ENTRY) de cada produto — usada
   * para estimar a validade de um produto junto com `expirationDateInDays`,
   * já que não existe mais controle de validade por lote. */
  findLastEntryDateByProductIds(
    productIds: string[],
  ): Promise<ProductLastEntryDate[]>;
}
