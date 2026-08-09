import { DeleteBatchUseCase } from '../usecase/delete-batch.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { makeBatch, makeLoggedUser } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';

describe('DeleteBatchUseCase', () => {
  let batchRepository: jest.Mocked<
    Pick<BatchRepository, 'findByIdAndCompanyId' | 'delete'>
  >;
  let batchMovementRepository: jest.Mocked<Pick<BatchMovementRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let updateStockProductUseCase: jest.Mocked<Pick<UpdateStockProductUseCase, 'execute'>>;
  let sut: DeleteBatchUseCase;

  beforeEach(() => {
    batchRepository = {
      findByIdAndCompanyId: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    batchMovementRepository = { save: jest.fn().mockResolvedValue(undefined) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    updateStockProductUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };

    sut = new DeleteBatchUseCase(
      batchRepository as unknown as BatchRepository,
      batchMovementRepository as unknown as BatchMovementRepository,
      loggedUserService,
      updateStockProductUseCase as unknown as UpdateStockProductUseCase,
    );
  });

  it('should throw NotFoundError when the batch does not exist for the logged company', async () => {
    batchRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'batch-1' })).rejects.toThrow(NotFoundError);
    expect(batchRepository.delete).not.toHaveBeenCalled();
  });

  it('should delete the batch without touching stock when there is no remaining quantity', async () => {
    const batch = makeBatch({ quantity: 10, remainingQuantity: 0 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({ id: batch.id });

    expect(output).toEqual({ id: batch.id });
    expect(batchMovementRepository.save).not.toHaveBeenCalled();
    expect(updateStockProductUseCase.execute).not.toHaveBeenCalled();
    expect(batchRepository.delete).toHaveBeenCalledWith(batch.id);
  });

  it('should register an EXIT movement and decrease stock when there is remaining quantity', async () => {
    const batch = makeBatch({ quantity: 10, remainingQuantity: 4 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id });

    expect(batchMovementRepository.save).toHaveBeenCalledTimes(1);
    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.type).toBe(TypeBatchMovement.EXIT);
    expect(movement.reason).toBe(TypeBatchMovementReason.DELETION);
    expect(movement.quantity).toBe(4);

    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: batch.product!.id,
      type: TypeOperationStock.DECREASE,
      value: 4,
    });
    expect(batchRepository.delete).toHaveBeenCalledWith(batch.id);
  });
});
