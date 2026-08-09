import { UpdateBatchUseCase } from '../usecase/update-batch.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { makeBatch, makeLoggedUser } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';

describe('UpdateBatchUseCase', () => {
  let batchRepository: jest.Mocked<
    Pick<BatchRepository, 'findByIdAndCompanyId' | 'update'>
  >;
  let batchMovementRepository: jest.Mocked<Pick<BatchMovementRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let updateStockProductUseCase: jest.Mocked<Pick<UpdateStockProductUseCase, 'execute'>>;
  let sut: UpdateBatchUseCase;

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

    sut = new UpdateBatchUseCase(
      batchRepository as unknown as BatchRepository,
      batchMovementRepository as unknown as BatchMovementRepository,
      loggedUserService,
      updateStockProductUseCase as unknown as UpdateStockProductUseCase,
    );
  });

  it('should throw NotFoundError when the batch does not exist for the logged company', async () => {
    batchRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'batch-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the new quantity is less than what was already consumed', async () => {
    // quantity 10, remaining 3 -> already consumed 7
    const batch = makeBatch({ quantity: 10, remainingQuantity: 3 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await expect(
      sut.execute({ id: batch.id, quantity: 5 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not touch stock nor create a movement when quantity does not change', async () => {
    const batch = makeBatch({ quantity: 10, remainingQuantity: 6 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id, quantity: 10 });

    expect(batchMovementRepository.save).not.toHaveBeenCalled();
    expect(updateStockProductUseCase.execute).not.toHaveBeenCalled();
    expect(batchRepository.update).toHaveBeenCalledWith(batch);
  });

  it('should register an ENTRY movement and increase stock when quantity increases', async () => {
    const batch = makeBatch({ quantity: 10, remainingQuantity: 6 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id, quantity: 15 });

    expect(batch.quantity).toBe(15);
    expect(batch.remainingQuantity).toBe(11);

    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.type).toBe(TypeBatchMovement.ENTRY);
    expect(movement.reason).toBe(TypeBatchMovementReason.CORRECTION);
    expect(movement.quantity).toBe(5);

    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: batch.product!.id,
      type: TypeOperationStock.INCREASE,
      value: 5,
    });
  });

  it('should register an EXIT movement and decrease stock when quantity decreases', async () => {
    const batch = makeBatch({ quantity: 10, remainingQuantity: 6 });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id, quantity: 8 });

    expect(batch.quantity).toBe(8);
    expect(batch.remainingQuantity).toBe(4);

    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.type).toBe(TypeBatchMovement.EXIT);
    expect(movement.quantity).toBe(2);

    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: batch.product!.id,
      type: TypeOperationStock.DECREASE,
      value: 2,
    });
  });

  it('should update the expiration date when informed', async () => {
    const batch = makeBatch({ expirationDate: new Date('2026-08-01') });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);
    const newExpiration = new Date('2026-09-01');

    await sut.execute({ id: batch.id, expirationDate: newExpiration });

    expect(batch.expirationDate).toBe(newExpiration);
  });

  it('should keep the current expiration date when not informed', async () => {
    const currentExpiration = new Date('2026-08-01');
    const batch = makeBatch({ expirationDate: currentExpiration });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id });

    expect(batch.expirationDate).toBe(currentExpiration);
  });

  it('should clear the expiration date when explicitly set to null', async () => {
    const batch = makeBatch({ expirationDate: new Date('2026-08-01') });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id, expirationDate: null });

    expect(batch.expirationDate).toBeNull();
  });
});
