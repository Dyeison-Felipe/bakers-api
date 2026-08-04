import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { BatchMovement } from '@/core/batch/domain/entities/batch-movement.entity';
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

  async update(): Promise<void> {
    throw new Error('BatchMovement é um registro imutável e não pode ser atualizado');
  }

  async delete(): Promise<void> {
    throw new Error('BatchMovement é um registro imutável e não pode ser removido');
  }
}
