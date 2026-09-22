import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { DailyProductionItem } from '@/core/daily-production/domain/entities/daily-production-item.entity';
import { DailyProductionItemSchema } from '../schema/daily-production-item.schema';
import { DailyProductionItemMapper } from './mappers/daily-production-item.mapper';
import { ProductionDayWindow } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { formatDateOnly } from '@/shared/infra/utils/format-date-only';

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

  async sumProducedPlannedCostByCompanyAndWindows(
    companyId: string,
    windows: ProductionDayWindow[],
  ): Promise<Map<string, number>> {
    const totals = new Map<string, number>();

    if (windows.length === 0) return totals;

    // Mesmas datas (YYYY-MM-DD) que a listagem individual de produções usa.
    const parameters: Record<string, unknown> = {
      companyId,
      status: TypeDailyProductionItemStatus.PRODUCED,
    };
    const rowsSql = windows.map((window, index) => {
      parameters[`windowId${index}`] = window.id;
      parameters[`windowFrom${index}`] = formatDateOnly(window.dateFrom);
      parameters[`windowTo${index}`] = formatDateOnly(window.dateTo);

      return `(CAST(:windowId${index} AS uuid), CAST(:windowFrom${index} AS date), CAST(:windowTo${index} AS date))`;
    });

    const rows = await this.dailyProductionItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.dailyProduction', 'dailyProduction')
      .innerJoin('dailyProduction.company', 'company')
      .innerJoin(
        `(SELECT w.id, w.date_from, w.date_to FROM (VALUES ${rowsSql.join(', ')}) AS w(id, date_from, date_to))`,
        'win',
        'dailyProduction.productionDate BETWEEN win.date_from AND win.date_to',
      )
      .select('win.id', 'windowId')
      .addSelect('COALESCE(SUM(item.plannedCost), 0)', 'total')
      .where('company.id = :companyId')
      .andWhere('item.status = :status')
      .setParameters(parameters)
      .groupBy('win.id')
      .getRawMany<{ windowId: string; total: string }>();

    rows.forEach((row) => totals.set(row.windowId, Number(row.total)));

    return totals;
  }

  async update(entity: DailyProductionItem): Promise<void> {
    const schema = DailyProductionItemMapper.toSchema(entity);
    await this.dailyProductionItemRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.dailyProductionItemRepository.softDelete(id);
  }
}
