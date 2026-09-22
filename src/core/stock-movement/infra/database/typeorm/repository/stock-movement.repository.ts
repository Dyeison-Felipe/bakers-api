import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockMovementRepository,
  StockMovementReportItem,
  StockMovementTimeWindow,
  ProductLastEntryDate,
} from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { StockMovement } from '@/core/stock-movement/domain/entities/stock-movement.entity';
import { TypeStockMovement, TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { ReportProductFilters } from '@/shared/application/types/report-product-filters';
import { StockMovementSchema } from '../schema/stock-movement.schema';
import { StockMovementMapper } from './mappers/stock-movement.mapper';

export class StockMovementRepositoryImpl implements StockMovementRepository {
  constructor(
    @InjectRepository(StockMovementSchema)
    private readonly stockMovementRepository: Repository<StockMovementSchema>,
  ) {}

  async save(entity: StockMovement): Promise<StockMovement> {
    const schema = StockMovementMapper.toSchema(entity);
    const saved = await this.stockMovementRepository.save(schema);

    const savedWithRelations = await this.stockMovementRepository.findOne({
      where: { id: saved.id },
      relations: ['product'],
    });

    return StockMovementMapper.toEntity(savedWithRelations!);
  }

  async findById(id: string): Promise<StockMovement | null> {
    const schema = await this.stockMovementRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!schema) return null;

    return StockMovementMapper.toEntity(schema);
  }

  async sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
  ): Promise<number> {
    const result = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .leftJoin('product.company', 'company')
      .select(
        'COALESCE(SUM(movement.quantity * movement.unitCostSnapshot), 0)',
        'total',
      )
      .where('company.id = :companyId', { companyId })
      .andWhere('movement.reason IN (:...reasons)', { reasons })
      .andWhere('movement.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async sumUnitCostByCompanyAndWindowsAndReason(
    companyId: string,
    windows: StockMovementTimeWindow[],
    reasons: TypeStockMovementReason[],
  ): Promise<Map<string, number>> {
    const totals = new Map<string, number>();

    if (windows.length === 0) return totals;

    // As janelas entram como uma tabela derivada (VALUES). Os limites são
    // convertidos para `timestamp` (sem fuso) exatamente como o parâmetro Date
    // do `BETWEEN` da versão individual é comparado com a coluna `created_at`.
    const parameters: Record<string, unknown> = { companyId, reasons };
    const rowsSql = windows.map((window, index) => {
      parameters[`windowId${index}`] = window.id;
      parameters[`windowFrom${index}`] = window.dateFrom;
      parameters[`windowTo${index}`] = window.dateTo;

      return `(CAST(:windowId${index} AS uuid), CAST(:windowFrom${index} AS timestamp), CAST(:windowTo${index} AS timestamp))`;
    });

    const rows = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .leftJoin('product.company', 'company')
      .innerJoin(
        `(SELECT w.id, w.date_from, w.date_to FROM (VALUES ${rowsSql.join(', ')}) AS w(id, date_from, date_to))`,
        'win',
        'movement.createdAt BETWEEN win.date_from AND win.date_to',
      )
      .select('win.id', 'windowId')
      .addSelect(
        'COALESCE(SUM(movement.quantity * movement.unitCostSnapshot), 0)',
        'total',
      )
      .where('company.id = :companyId')
      .andWhere('movement.reason IN (:...reasons)')
      .setParameters(parameters)
      .groupBy('win.id')
      .getRawMany<{ windowId: string; total: string }>();

    rows.forEach((row) => totals.set(row.windowId, Number(row.total)));

    return totals;
  }

  async findAllByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
    filters?: ReportProductFilters,
  ): Promise<StockMovementReportItem[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .leftJoin('product.company', 'company')
      .leftJoin('product.category', 'category')
      .select('movement.id', 'id')
      .addSelect('movement.createdAt', 'createdAt')
      .addSelect('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('movement.quantity', 'quantity')
      .addSelect('product.unitOfMeasurement', 'unitOfMeasurement')
      .addSelect('product.consumerUnit', 'consumerUnit')
      .addSelect('movement.unitCostSnapshot', 'unitCostSnapshot')
      .addSelect(
        'COALESCE(movement.quantity * movement.unitCostSnapshot, 0)',
        'totalCost',
      )
      .addSelect('movement.type', 'type')
      .addSelect('movement.reason', 'reason')
      .addSelect('movement.reasonDescription', 'reasonDescription')
      .where('company.id = :companyId', { companyId })
      .andWhere('movement.reason IN (:...reasons)', { reasons })
      .andWhere('movement.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    if (filters?.productId) {
      query.andWhere('product.id = :productId', { productId: filters.productId });
    }
    if (filters?.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.typeProduct) {
      query.andWhere('product.typeProduct = :typeProduct', {
        typeProduct: filters.typeProduct,
      });
    }

    const rows = await query
      .orderBy('movement.createdAt', 'DESC')
      .getRawMany<{
        id: string;
        createdAt: Date;
        productId: string;
        productName: string;
        quantity: string;
        unitOfMeasurement: StockMovementReportItem['unitOfMeasurement'];
        consumerUnit: StockMovementReportItem['consumerUnit'];
        unitCostSnapshot: string | null;
        totalCost: string;
        type: TypeStockMovement;
        reason: TypeStockMovementReason;
        reasonDescription: string | null;
      }>();

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      productId: row.productId,
      productName: row.productName,
      quantity: Number(row.quantity),
      unitOfMeasurement: row.unitOfMeasurement,
      consumerUnit: row.consumerUnit,
      unitCostSnapshot:
        row.unitCostSnapshot === null ? null : Number(row.unitCostSnapshot),
      totalCost: Number(row.totalCost),
      type: row.type,
      reason: row.reason,
      reasonDescription: row.reasonDescription,
    }));
  }

  async findLastEntryDateByProductIds(
    productIds: string[],
  ): Promise<ProductLastEntryDate[]> {
    if (!productIds.length) return [];

    const rows = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .select('product.id', 'productId')
      .addSelect('MAX(movement.createdAt)', 'lastEntryDate')
      .where('product.id IN (:...productIds)', { productIds })
      .andWhere('movement.type = :type', { type: TypeStockMovement.ENTRY })
      .groupBy('product.id')
      .getRawMany<{ productId: string; lastEntryDate: Date }>();

    return rows.map((row) => ({
      productId: row.productId,
      lastEntryDate: row.lastEntryDate,
    }));
  }

  async update(): Promise<void> {
    throw new Error('StockMovement é um registro imutável e não pode ser atualizado');
  }

  async delete(): Promise<void> {
    throw new Error('StockMovement é um registro imutável e não pode ser removido');
  }
}
