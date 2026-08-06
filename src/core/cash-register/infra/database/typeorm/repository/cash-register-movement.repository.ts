import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegisterMovementRepository } from '@/core/cash-register/domain/repositories/cash-register-movement.repository';
import { CashRegisterMovement } from '@/core/cash-register/domain/entities/cash-register-movement.entity';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { CashRegisterMovementSchema } from '../schema/cash-register-movement.schema';
import { CashRegisterMovementMapper } from './mappers/cash-register-movement.mapper';

export class CashRegisterMovementRepositoryImpl
  implements CashRegisterMovementRepository
{
  constructor(
    @InjectRepository(CashRegisterMovementSchema)
    private readonly cashRegisterMovementRepository: Repository<CashRegisterMovementSchema>,
  ) {}

  async save(entity: CashRegisterMovement): Promise<CashRegisterMovement> {
    const schema = CashRegisterMovementMapper.toSchema(entity);
    const saved = await this.cashRegisterMovementRepository.save(schema);

    const savedWithRelations = await this.cashRegisterMovementRepository.findOne({
      where: { id: saved.id },
      relations: ['cashRegisterSession'],
    });

    return CashRegisterMovementMapper.toEntity(savedWithRelations!);
  }

  async findById(id: string): Promise<CashRegisterMovement | null> {
    const schema = await this.cashRegisterMovementRepository.findOne({
      where: { id },
      relations: ['cashRegisterSession'],
    });

    if (!schema) return null;

    return CashRegisterMovementMapper.toEntity(schema);
  }

  async findAllByCashRegisterSessionId(
    cashRegisterSessionId: string,
  ): Promise<CashRegisterMovement[]> {
    const schemas = await this.cashRegisterMovementRepository.find({
      where: { cashRegisterSession: { id: cashRegisterSessionId } },
      relations: ['cashRegisterSession'],
      order: { createdAt: 'ASC' },
    });

    return schemas.map((schema) => CashRegisterMovementMapper.toEntity(schema));
  }

  async sumAmountByCashRegisterSessionIdAndType(
    cashRegisterSessionId: string,
    type: TypeCashRegisterMovement,
  ): Promise<number> {
    const result = await this.cashRegisterMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.cashRegisterSession', 'cashRegisterSession')
      .select('COALESCE(SUM(movement.amount), 0)', 'total')
      .where('cashRegisterSession.id = :cashRegisterSessionId', {
        cashRegisterSessionId,
      })
      .andWhere('movement.type = :type', { type })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async update(): Promise<void> {
    throw new Error(
      'CashRegisterMovement é um registro imutável e não pode ser atualizado',
    );
  }

  async delete(): Promise<void> {
    throw new Error(
      'CashRegisterMovement é um registro imutável e não pode ser removido',
    );
  }
}
