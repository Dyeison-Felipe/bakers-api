import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { BatchMovement } from '@/core/batch/domain/entities/batch-movement.entity';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { BatchMovementSchema } from '../schema/batch-movement.schema';
import { BatchMovementMapper } from './mappers/batch-movement.mapper';

export class BatchMovementRepositoryImpl implements BatchMovementRepository {
  constructor(
    @InjectRepository(BatchMovementSchema)
    private readonly batchMovementRepository: Repository<BatchMovementSchema>,
  ) {}

  async save(entity: BatchMovement): Promise<BatchMovement> {
    const schema = BatchMovementMapper.toSchema(entity);
    const saved = await this.batchMovementRepository.save(schema);

    const savedWithRelations = await this.batchMovementRepository.findOne({
      where: { id: saved.id },
      relations: ['batch'],
    });

    return BatchMovementMapper.toEntity(savedWithRelations!);
  }

  async findById(id: string): Promise<BatchMovement | null> {
    const schema = await this.batchMovementRepository.findOne({
      where: { id },
      relations: ['batch'],
    });

    if (!schema) return null;

    return BatchMovementMapper.toEntity(schema);
  }

  async findAllByBatchId(batchId: string): Promise<BatchMovement[]> {
    const schemas = await this.batchMovementRepository.find({
      where: { batch: { id: batchId } },
      relations: ['batch'],
      order: { createdAt: 'ASC' },
    });

    return schemas.map((schema) => BatchMovementMapper.toEntity(schema));
  }

  async sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeBatchMovementReason[],
  ): Promise<number> {
    const result = await this.batchMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.batch', 'batch')
      .leftJoin('batch.company', 'company')
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

  async update(): Promise<void> {
    throw new Error('BatchMovement é um registro imutável e não pode ser atualizado');
  }

  async delete(): Promise<void> {
    throw new Error('BatchMovement é um registro imutável e não pode ser removido');
  }
}
