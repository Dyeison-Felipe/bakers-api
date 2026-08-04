import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { DailyProductionItem } from '@/core/daily-production/domain/entities/daily-production-item.entity';
import { DailyProductionItemSchema } from '../schema/daily-production-item.schema';
import { DailyProductionItemMapper } from './mappers/daily-production-item.mapper';

export class DailyProductionItemRepositoryImpl
  implements DailyProductionItemRepository
{
  constructor(
    @InjectRepository(DailyProductionItemSchema)
    private readonly dailyProductionItemRepository: Repository<DailyProductionItemSchema>,
  ) {}

  async save(entity: DailyProductionItem): Promise<DailyProductionItem> {
    const schema = DailyProductionItemMapper.toSchema(entity);
    const saved = await this.dailyProductionItemRepository.save(schema);
    return (await this.findByIdWithDailyProduction(
      saved.id,
    )) as DailyProductionItem;
  }

  async findById(id: string): Promise<DailyProductionItem | null> {
    const schema = await this.dailyProductionItemRepository.findOne({
      where: { id },
      relations: ['product', 'product.category', 'dailyProduction', 'dailyProduction.company'],
    });

    if (!schema) return null;

    return DailyProductionItemMapper.toEntity(schema);
  }

  async findByIdWithDailyProduction(
    id: string,
  ): Promise<DailyProductionItem | null> {
    return this.findById(id);
  }

  async findAllByDailyProductionId(
    dailyProductionId: string,
  ): Promise<DailyProductionItem[]> {
    const schemas = await this.dailyProductionItemRepository.find({
      where: { dailyProduction: { id: dailyProductionId } },
      relations: ['product', 'product.category', 'dailyProduction', 'dailyProduction.company'],
      order: { createdAt: 'ASC' },
    });

    return schemas.map((schema) => DailyProductionItemMapper.toEntity(schema));
  }

  async update(entity: DailyProductionItem): Promise<void> {
    const schema = DailyProductionItemMapper.toSchema(entity);
    await this.dailyProductionItemRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.dailyProductionItemRepository.softDelete(id);
  }
}
