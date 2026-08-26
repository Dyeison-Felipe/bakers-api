import { BatchMovementReportItem } from '@/core/batch/domain/repositories/batch-movement.repository';

export type FindWasteMovementsOutput = {
  items: BatchMovementReportItem[];
};
