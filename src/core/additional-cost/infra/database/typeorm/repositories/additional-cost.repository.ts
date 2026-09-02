import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AdditionalCostSchema } from '../schema/additional-cost.schema';
import { FindOptionsRelations, In, Repository } from 'typeorm';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { AdditionalCostMapper } from './mappers/additional-cost-mapper';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';

export class AdditionalCostRepositoryImpl implements AdditionalCostRepository {
  constructor(
    @InjectRepository(AdditionalCostSchema)
    private readonly additionalCostRepsoitory: Repository<AdditionalCostSchema>,
  ) {}

  async findById(id: string): Promise<AdditionalCost | null> {
    const schema = await this.additionalCostRepsoitory.findOne({
      where: { id },
      relations: this.getRelations(),
    });
    return schema ? AdditionalCostMapper.toEntity(schema) : null;
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<AdditionalCost | null> {
    const schema = await this.additionalCostRepsoitory.findOne({
      where: { id, company: { id: companyId } },
      relations: this.getRelations(),
    });
    return schema ? AdditionalCostMapper.toEntity(schema) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<AdditionalCost[]> {
    const schemas = await this.additionalCostRepsoitory.find({
      where: { company: { id: companyId } },
      relations: this.getRelations(),
      order: { name: 'ASC' },
    });
    return schemas.map(AdditionalCostMapper.toEntity);
  }

  async save(entity: AdditionalCost): Promise<AdditionalCost> {
    const schema = AdditionalCostMapper.toSchema(entity);
    const save = await this.additionalCostRepsoitory.save(schema);

    const entityAdditionalCost = AdditionalCostMapper.toEntity(save);

    return entityAdditionalCost;
  }

  async update(entity: AdditionalCost): Promise<void> {
    const schema = AdditionalCostMapper.toSchema(entity);
    await this.additionalCostRepsoitory.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.additionalCostRepsoitory.softDelete(id);
  }

  async findAllByIdsAndCompanyId(
    ids: string[],
    companyId: string,
  ): Promise<AdditionalCost[]> {
    const schemas = await this.additionalCostRepsoitory.find({
      where: { id: In(ids), company: { id: companyId } },
      relations: this.getRelations(),
    });
    return schemas.map(AdditionalCostMapper.toEntity);
  }

  private getRelations(): FindOptionsRelations<ProductSchema> {
    return {
      company: {
        address: {
          city: {
            state: true,
          },
        },
        plan: {
          planPermission: {
            permission: true,
          },
        },
      },
    };
  }
}
