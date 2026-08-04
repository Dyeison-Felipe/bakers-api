import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
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
    return saved.map((schema) => SaleItemMapper.toEntity(schema));
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

  async update(entity: SaleItem): Promise<void> {
    const schema = SaleItemMapper.toSchema(entity);
    await this.saleItemRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.saleItemRepository.softDelete(id);
  }
}
