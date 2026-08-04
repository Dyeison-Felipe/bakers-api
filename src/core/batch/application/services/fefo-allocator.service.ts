import { BadRequestError } from '@/shared/application/errors/bad-request-error';

export type AvailableBatch = {
  id: string;
  remainingQuantity: number;
};

export type FefoAllocation = {
  batchId: string;
  quantityToTake: number;
};

const EPSILON = 0.0001;

export class FefoAllocatorService {
  static allocate(
    availableBatches: AvailableBatch[],
    requestedQuantity: number,
  ): FefoAllocation[] {
    let remaining = requestedQuantity;
    const allocations: FefoAllocation[] = [];

    for (const batch of availableBatches) {
      if (remaining <= EPSILON) break;
      if (batch.remainingQuantity <= 0) continue;

      const quantityToTake = Math.min(batch.remainingQuantity, remaining);

      allocations.push({ batchId: batch.id, quantityToTake });
      remaining -= quantityToTake;
    }

    if (remaining > EPSILON) {
      throw new BadRequestError(
        `Estoque em lote insuficiente para a baixa solicitada. Faltam ${remaining.toFixed(3)} unidade(s)/kg.`,
      );
    }

    return allocations;
  }
}
