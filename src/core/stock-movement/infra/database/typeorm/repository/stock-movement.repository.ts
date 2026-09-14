import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockMovementRepository,
  StockMovementReportItem,
} from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { StockMovement } from '@/core/stock-movement/domain/entities/stock-movement.entity';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
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

  async findAllByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
  ): Promise<StockMovementReportItem[]> {
    const rows = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .leftJoin('product.company', 'company')
      .select('movement.id', 'id')
      .addSelect('movement.createdAt', 'createdAt')
      .addSelect('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('movement.quantity', 'quantity')
      .addSelect('product.unitOfMeasurement', 'unitOfMeasurement')
      .addSelect('movement.unitCostSnapshot', 'unitCostSnapshot')
      .addSelect(
        'COALESCE(movement.quantity * movement.unitCostSnapshot, 0)',
        'totalCost',
      )
      .addSelect('movement.reason', 'reason')
      .addSelect('movement.reasonDescription', 'reasonDescription')
      .where('company.id = :companyId', { companyId })
      .andWhere('movement.reason IN (:...reasons)', { reasons })
      .andWhere('movement.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .orderBy('movement.createdAt', 'DESC')
      .getRawMany<{
        id: string;
        createdAt: Date;
        productId: string;
        productName: string;
        quantity: string;
        unitOfMeasurement: StockMovementReportItem['unitOfMeasurement'];
        unitCostSnapshot: string | null;
        totalCost: string;
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
      unitCostSnapshot:
        row.unitCostSnapshot === null ? null : Number(row.unitCostSnapshot),
      totalCost: Number(row.totalCost),
      reason: row.reason,
      reasonDescription: row.reasonDescription,
    }));
  }

  async update(): Promise<void> {
    throw new Error('StockMovement é um registro imutável e não pode ser atualizado');
  }

  async delete(): Promise<void> {
    throw new Error('StockMovement é um registro imutável e não pode ser removido');
  }
}
