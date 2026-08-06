import { CashRegisterMovement } from '@/core/cash-register/domain/entities/cash-register-movement.entity';
import { CashRegisterMovementSchema } from '../../schema/cash-register-movement.schema';
import { CashRegisterSessionMapper } from './cash-register-session.mapper';
import { CashRegisterSessionSchema } from '../../schema/cash-register-session.schema';

export class CashRegisterMovementMapper {
  static toEntity(schema: CashRegisterMovementSchema): CashRegisterMovement {
    return new CashRegisterMovement({
      id: schema.id,
      cashRegisterSession: schema.cashRegisterSession
        ? CashRegisterSessionMapper.toEntity(schema.cashRegisterSession)
        : null,
      type: schema.type,
      reason: schema.reason,
      description: schema.description,
      amount: schema.amount,
      balanceBefore: schema.balanceBefore,
      balanceAfter: schema.balanceAfter,
      createdBy: schema.createdBy,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: CashRegisterMovement): CashRegisterMovementSchema {
    return CashRegisterMovementSchema.with({
      id: entity.id,
      cashRegisterSession: {
        id: entity.cashRegisterSession!.id,
      } as CashRegisterSessionSchema,
      type: entity.type,
      reason: entity.reason,
      description: entity.description,
      amount: entity.amount,
      balanceBefore: entity.balanceBefore,
      balanceAfter: entity.balanceAfter,
      createdBy: entity.createdBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
