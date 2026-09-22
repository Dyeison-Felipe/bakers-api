import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { DailyProductionItem } from '../entities/daily-production-item.entity';

// Janela de dias (produções com `productionDate` entre `dateFrom` e `dateTo`,
// inclusive) identificada por uma chave (ex.: id da sessão de caixa).
export type ProductionDayWindow = {
  id: string;
  dateFrom: Date;
  dateTo: Date;
};

export interface DailyProductionItemRepository
  extends BaseRepository<DailyProductionItem> {
  update(entity: DailyProductionItem): Promise<void>;

  findByIdWithDailyProduction(
    id: string,
  ): Promise<DailyProductionItem | null>;

  findAllByDailyProductionId(
    dailyProductionId: string,
  ): Promise<DailyProductionItem[]>;

  /** Soma bruta do custo planejado dos itens PRODUZIDOS das produções da
   * empresa em cada janela de dias — uma query para todas as janelas. Janela
   * sem itens produzidos não aparece no Map. */
  sumProducedPlannedCostByCompanyAndWindows(
    companyId: string,
    windows: ProductionDayWindow[],
  ): Promise<Map<string, number>>;
}
