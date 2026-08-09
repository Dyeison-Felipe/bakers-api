import { DiscardBatchLeftoverUseCase } from '../usecase/discard-batch-leftover.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeOperationStock, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { makeBatch, makeLoggedUser, makeProduct } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';

describe('DiscardBatchLeftoverUseCase', () => {
  let batchRepository: jest.Mocked<
    Pick<BatchRepository, 'findByIdAndCompanyId' | 'update'>
  >;
  let batchMovementRepository: jest.Mocked<Pick<BatchMovementRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let updateStockProductUseCase: jest.Mocked<Pick<UpdateStockProductUseCase, 'execute'>>;
  let sut: DiscardBatchLeftoverUseCase;

  beforeEach(() => {
    batchRepository = {
      findByIdAndCompanyId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    batchMovementRepository = { save: jest.fn().mockResolvedValue(undefined) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    updateStockProductUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };

    sut = new DiscardBatchLeftoverUseCase(
      batchRepository as unknown as BatchRepository,
      batchMovementRepository as unknown as BatchMovementRepository,
      loggedUserService,
      updateStockProductUseCase as unknown as UpdateStockProductUseCase,
    );
  });

  it('should throw NotFoundError when the batch does not exist for the logged company', async () => {
    batchRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ batchId: 'batch-1' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw BadRequestError when quantity is zero or negative', async () => {
    const batch = makeBatch({ remainingQuantity: 5 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await expect(
      sut.execute({ batchId: batch.id, quantity: 0 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when quantity exceeds remaining quantity', async () => {
    const batch = makeBatch({ remainingQuantity: 5 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await expect(
      sut.execute({ batchId: batch.id, quantity: 6 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should default to discarding the full remaining quantity when none is informed', async () => {
    const batch = makeBatch({ remainingQuantity: 7 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({ batchId: batch.id });

    expect(output.discardedQuantity).toBe(7);
    expect(batch.remainingQuantity).toBe(0);
  });

  it('should register a WASTE movement and return lossValue when soldAtCost is false', async () => {
    const product = makeProduct({ unitCostPrice: 3 });
    const batch = makeBatch({
      remainingQuantity: 10,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      product,
    });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({ batchId: batch.id, quantity: 4 });

    expect(output).toEqual({
      id: batch.id,
      discardedQuantity: 4,
      soldAtCost: false,
      lossValue: 12,
      recoveredValue: null,
    });

    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.type).toBe(TypeBatchMovement.EXIT);
    expect(movement.reason).toBe(TypeBatchMovementReason.WASTE);
    expect(movement.quantity).toBe(4);

    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: TypeOperationStock.DECREASE,
      value: 4,
    });
  });

  it('should register a LEFTOVER_SOLD_AT_COST movement and return recoveredValue when soldAtCost is true', async () => {
    const product = makeProduct({ unitCostPrice: 2.5 });
    const batch = makeBatch({
      remainingQuantity: 10,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      product,
    });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({
      batchId: batch.id,
      quantity: 2,
      soldAtCost: true,
    });

    expect(output).toEqual({
      id: batch.id,
      discardedQuantity: 2,
      soldAtCost: true,
      lossValue: null,
      recoveredValue: 5,
    });

    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.reason).toBe(TypeBatchMovementReason.LEFTOVER_SOLD_AT_COST);
  });

  it('should use pricePerKilogram as cost basis for weight-based batches', async () => {
    const product = makeProduct({ unitCostPrice: 3, pricePerKilogram: 10 });
    const batch = makeBatch({
      remainingQuantity: 5,
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      product,
    });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({ batchId: batch.id, quantity: 2 });

    expect(output.lossValue).toBe(20);
  });

  it('should persist the batch update via the repository', async () => {
    const batch = makeBatch({ remainingQuantity: 10 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ batchId: batch.id, quantity: 3 });

    expect(batchRepository.update).toHaveBeenCalledWith(batch);
  });
});
