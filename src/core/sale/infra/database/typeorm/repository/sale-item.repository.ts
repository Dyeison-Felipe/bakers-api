import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  SaleItemRepository,
  SalesCostSummary,
  ProductRevenueAndCost,
} from '@/core/sale/domain/repositories/sale-item.repository';
import { SaleItem } from '@/core/sale/domain/entities/sale-item.entity';
import { SaleItemSchema } from '../schema/sale-item.schema';
import { SaleItemMapper } from './mappers/sale-item.mapper';

export class SaleItemRepositoryImpl implements SaleItemRepository {
  constructor(
    @InjectRepository(SaleItemSchema)
    private readonly saleItemRepository: Repository<SaleItemSchema>,
  ) {}

  async save(entity: SaleItem): Promise<SaleItem> {
    const schema = SaleItemMapper.toSchema(entity);
    const saved = await this.saleItemRepository.save(schema);
    return this.findById(saved.id) as Promise<SaleItem>;
  }

  async saveMany(entities: SaleItem[]): Promise<SaleItem[]> {
    const schemas = entities.map((entity) => SaleItemMapper.toSchema(entity));
    const saved = await this.saleItemRepository.save(schemas);

    const fullSchemas = await this.saleItemRepository.find({
      where: { id: In(saved.map((schema) => schema.id)) },
      relations: ['product'],
    });

    return fullSchemas.map((schema) => SaleItemMapper.toEntity(schema));
  }

  async findById(id: string): Promise<SaleItem | null> {
    const schema = await this.saleItemRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!schema) return null;

    return SaleItemMapper.toEntity(schema);
  }

  async findAllBySaleId(saleId: string): Promise<SaleItem[]> {
    const schemas = await this.saleItemRepository.find({
      where: { sale: { id: saleId } },
      relations: ['product'],
    });

    return schemas.map((schema) => SaleItemMapper.toEntity(schema));
  }

  async sumRevenueAndCostByCompanyAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<SalesCostSummary> {
    const result = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .leftJoin('saleItem.sale', 'sale')
      .leftJoin('sale.company', 'company')
      .select('COALESCE(SUM(saleItem.subtotal), 0)', 'totalRevenue')
      .addSelect(
        'COALESCE(SUM(saleItem.unitCostSnapshot * COALESCE(saleItem.quantity, saleItem.weightInKg)), 0)',
        'totalCost',
      )
      .where('company.id = :companyId', { companyId })
      .andWhere('sale.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .getRawOne<{ totalRevenue: string; totalCost: string }>();

    return {
      totalRevenue: Number(result?.totalRevenue ?? 0),
      totalCost: Number(result?.totalCost ?? 0),
    };
  }

  async sumRevenueAndCostByCashRegisterSessionId(
    cashRegisterSessionId: string,
  ): Promise<SalesCostSummary> {
    const result = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .leftJoin('saleItem.sale', 'sale')
      .leftJoin('sale.cashRegisterSession', 'cashRegisterSession')
      .select('COALESCE(SUM(saleItem.subtotal), 0)', 'totalRevenue')
      .addSelect(
        'COALESCE(SUM(saleItem.unitCostSnapshot * COALESCE(saleItem.quantity, saleItem.weightInKg)), 0)',
        'totalCost',
      )
      .where('cashRegisterSession.id = :cashRegisterSessionId', {
        cashRegisterSessionId,
      })
      .getRawOne<{ totalRevenue: string; totalCost: string }>();

    return {
      totalRevenue: Number(result?.totalRevenue ?? 0),
      totalCost: Number(result?.totalCost ?? 0),
    };
  }

  async findRevenueAndCostByProductAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ProductRevenueAndCost[]> {
    const rows = await this.saleItemRepository
      .createQueryBuilder('saleItem')
      .innerJoin('saleItem.sale', 'sale')
      .innerJoin('sale.company', 'company')
      .innerJoin('saleItem.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect(
        'COALESCE(SUM(COALESCE(saleItem.quantity, saleItem.weightInKg)), 0)',
        'quantitySold',
      )
      .addSelect('COALESCE(SUM(saleItem.subtotal), 0)', 'revenue')
      .addSelect(
        'COALESCE(SUM(saleItem.unitCostSnapshot * COALESCE(saleItem.quantity, saleItem.weightInKg)), 0)',
        'cost',
      )
      .where('company.id = :companyId', { companyId })
      .andWhere('sale.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .getRawMany<{
        productId: string;
        productName: string;
        quantitySold: string;
        revenue: string;
        cost: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantitySold: Number(row.quantitySold),
      revenue: Number(row.revenue),
      cost: Number(row.cost),
    }));
  }

  async update(entity: SaleItem): Promise<void> {
    const schema = SaleItemMapper.toSchema(entity);
    await this.saleItemRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.saleItemRepository.softDelete(id);
  }
}
