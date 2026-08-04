import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { SaleItem } from '../entities/sale-item.entity';

export interface SaleItemRepository extends BaseRepository<SaleItem> {
  saveMany(entities: SaleItem[]): Promise<SaleItem[]>;

  findAllBySaleId(saleId: string): Promise<SaleItem[]>;
}
