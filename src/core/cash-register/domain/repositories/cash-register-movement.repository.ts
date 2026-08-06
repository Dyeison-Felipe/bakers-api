import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { CashRegisterMovement } from '../entities/cash-register-movement.entity';

export interface CashRegisterMovementRepository
  extends BaseRepository<CashRegisterMovement> {
  findAllByCashRegisterSessionId(
    cashRegisterSessionId: string,
  ): Promise<CashRegisterMovement[]>;

  sumAmountByCashRegisterSessionIdAndType(
    cashRegisterSessionId: string,
    type: TypeCashRegisterMovement,
  ): Promise<number>;
}
