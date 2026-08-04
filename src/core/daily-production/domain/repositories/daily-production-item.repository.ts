import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { DailyProductionItem } from '../entities/daily-production-item.entity';

export interface DailyProductionItemRepository
  extends BaseRepository<DailyProductionItem> {
  update(entity: DailyProductionItem): Promise<void>;

  findByIdWithDailyProduction(
    id: string,
  ): Promise<DailyProductionItem | null>;

  findAllByDailyProductionId(
    dailyProductionId: string,
  ): Promise<DailyProductionItem[]>;
}
