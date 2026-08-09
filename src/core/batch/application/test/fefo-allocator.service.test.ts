import { FefoAllocatorService } from '../services/fefo-allocator.service';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';

describe('FefoAllocatorService', () => {
  it('should allocate the full quantity from a single batch when it has enough stock', () => {
    const allocations = FefoAllocatorService.allocate(
      [{ id: 'batch-1', remainingQuantity: 10 }],
      4,
    );

    expect(allocations).toEqual([{ batchId: 'batch-1', quantityToTake: 4 }]);
  });

  it('should allocate across multiple batches in the given (FEFO) order', () => {
    const allocations = FefoAllocatorService.allocate(
      [
        { id: 'batch-1', remainingQuantity: 3 },
        { id: 'batch-2', remainingQuantity: 5 },
      ],
      6,
    );

    expect(allocations).toEqual([
      { batchId: 'batch-1', quantityToTake: 3 },
      { batchId: 'batch-2', quantityToTake: 3 },
    ]);
  });

  it('should skip batches with zero or negative remaining quantity', () => {
    const allocations = FefoAllocatorService.allocate(
      [
        { id: 'batch-1', remainingQuantity: 0 },
        { id: 'batch-2', remainingQuantity: -1 },
        { id: 'batch-3', remainingQuantity: 5 },
      ],
      3,
    );

    expect(allocations).toEqual([{ batchId: 'batch-3', quantityToTake: 3 }]);
  });

  it('should stop as soon as the requested quantity is fully allocated', () => {
    const allocations = FefoAllocatorService.allocate(
      [
        { id: 'batch-1', remainingQuantity: 10 },
        { id: 'batch-2', remainingQuantity: 10 },
      ],
      5,
    );

    expect(allocations).toEqual([{ batchId: 'batch-1', quantityToTake: 5 }]);
  });

  it('should throw BadRequestError when total available stock is insufficient', () => {
    expect(() =>
      FefoAllocatorService.allocate(
        [{ id: 'batch-1', remainingQuantity: 2 }],
        5,
      ),
    ).toThrow(BadRequestError);
  });

  it('should return an empty allocation list when the requested quantity is zero', () => {
    const allocations = FefoAllocatorService.allocate(
      [{ id: 'batch-1', remainingQuantity: 10 }],
      0,
    );

    expect(allocations).toEqual([]);
  });

  it('should tolerate sub-epsilon floating point leftovers without throwing', () => {
    const allocations = FefoAllocatorService.allocate(
      [{ id: 'batch-1', remainingQuantity: 0.1 + 0.2 }],
      0.3,
    );

    expect(allocations).toEqual([{ batchId: 'batch-1', quantityToTake: 0.3 }]);
  });
});
