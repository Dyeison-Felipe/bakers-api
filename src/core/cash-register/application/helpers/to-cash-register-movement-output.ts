import { CashRegisterMovementOutput } from '@/shared/application/output/cash-register/cash-register-movement.output';
import { CashRegisterMovement } from '../../domain/entities/cash-register-movement.entity';

/**
 * Formato único de saída de uma sangria/incremento — usado tanto na listagem
 * de movimentos do caixa quanto no detalhe do caixa (Histórico de Caixa).
 */
export const toCashRegisterMovementOutput = (
  movement: CashRegisterMovement,
): CashRegisterMovementOutput => ({
  id: movement.id,
  type: movement.type,
  reason: movement.reason,
  description: movement.description,
  amount: movement.amount,
  balanceBefore: movement.balanceBefore,
  balanceAfter: movement.balanceAfter,
  createdAt: movement.auditable!.createdAt,
});
