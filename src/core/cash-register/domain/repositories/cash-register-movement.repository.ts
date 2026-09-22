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

  /** Versão em lote de `sumAmountByCashRegisterSessionIdAndType`. Sessão sem
   * movimentos do tipo não aparece no Map. */
  sumAmountByCashRegisterSessionIdsAndType(
    cashRegisterSessionIds: string[],
    type: TypeCashRegisterMovement,
  ): Promise<Map<string, number>>;
}
