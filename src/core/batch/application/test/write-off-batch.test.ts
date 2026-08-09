import { WriteOffBatchUseCase } from '../usecase/write-off-batch.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { makeBatch, makeLoggedUser, makeProduct } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';

describe('WriteOffBatchUseCase', () => {
  let batchRepository: jest.Mocked<
    Pick<BatchRepository, 'findAvailableByProductIdOrderByExpiration' | 'update'>
  >;
  let batchMovementRepository: jest.Mocked<Pick<BatchMovementRepository, 'save'>>;
  let productRepository: jest.Mocked<
    Pick<ProductRepository, 'findProductByIdAndCompanyId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let updateStockProductUseCase: jest.Mocked<Pick<UpdateStockProductUseCase, 'execute'>>;
  let sut: WriteOffBatchUseCase;

  beforeEach(() => {
    batchRepository = {
      findAvailableByProductIdOrderByExpiration: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    batchMovementRepository = { save: jest.fn().mockResolvedValue(undefined) };
    productRepository = { findProductByIdAndCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    updateStockProductUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };

    sut = new WriteOffBatchUseCase(
      batchRepository as unknown as BatchRepository,
      batchMovementRepository as unknown as BatchMovementRepository,
      productRepository as unknown as ProductRepository,
      loggedUserService,
      updateStockProductUseCase as unknown as UpdateStockProductUseCase,
    );
  });

  it('should throw NotFoundError when the product does not exist for the logged company', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({
        productId: 'product-1',
        quantity: 5,
        reason: TypeBatchMovementReason.WASTE,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError (propagated from FefoAllocatorService) when stock is insufficient', async () => {
    const product = makeProduct();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);
    batchRepository.findAvailableByProductIdOrderByExpiration.mockResolvedValue([
      makeBatch({ id: 'batch-1', remainingQuantity: 2 }),
    ]);

    await expect(
      sut.execute({
        productId: product.id,
        quantity: 10,
        reason: TypeBatchMovementReason.WASTE,
      }),
    ).rejects.toThrow(BadRequestError);

    expect(batchRepository.update).not.toHaveBeenCalled();
    expect(updateStockProductUseCase.execute).not.toHaveBeenCalled();
  });

  it('should consume batches FEFO-ordered, register one EXIT movement per batch consumed, and decrease stock once for the total', async () => {
    const product = makeProduct();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);
    const batchA = makeBatch({
      id: '11111111-1111-4111-8111-111111111111',
      remainingQuantity: 3,
    });
    const batchB = makeBatch({
      id: '22222222-2222-4222-8222-222222222222',
      remainingQuantity: 10,
    });
    batchRepository.findAvailableByProductIdOrderByExpiration.mockResolvedValue([
      batchA,
      batchB,
    ]);

    const output = await sut.execute({
      productId: product.id,
      quantity: 5,
      reason: TypeBatchMovementReason.WASTE,
      reasonDescription: 'quebrou',
    });

    expect(batchA.remainingQuantity).toBe(0);
    expect(batchB.remainingQuantity).toBe(8);

    expect(batchRepository.update).toHaveBeenCalledTimes(2);
    expect(batchMovementRepository.save).toHaveBeenCalledTimes(2);

    const [firstMovement, secondMovement] =
      batchMovementRepository.save.mock.calls.map((call) => call[0]);
    expect(firstMovement.batchId).toBe(batchA.id);
    expect(firstMovement.quantity).toBe(3);
    expect(secondMovement.batchId).toBe(batchB.id);
    expect(secondMovement.quantity).toBe(2);
    expect(firstMovement.type).toBe(TypeBatchMovement.EXIT);
    expect(firstMovement.reason).toBe(TypeBatchMovementReason.WASTE);
    expect(firstMovement.reasonDescription).toBe('quebrou');

    expect(updateStockProductUseCase.execute).toHaveBeenCalledTimes(1);
    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: TypeOperationStock.DECREASE,
      value: 5,
    });

    expect(output).toEqual({
      productId: product.id,
      totalWrittenOff: 5,
      batchesAffected: 2,
    });
  });

  it('should skip batches with no remaining quantity', async () => {
    const product = makeProduct();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);
    const emptyBatch = makeBatch({
      id: '33333333-3333-4333-8333-333333333333',
      remainingQuantity: 0,
    });
    const availableBatch = makeBatch({
      id: '44444444-4444-4444-8444-444444444444',
      remainingQuantity: 5,
    });
    batchRepository.findAvailableByProductIdOrderByExpiration.mockResolvedValue([
      emptyBatch,
      availableBatch,
    ]);

    const output = await sut.execute({
      productId: product.id,
      quantity: 3,
      reason: TypeBatchMovementReason.WASTE,
    });

    expect(output.batchesAffected).toBe(1);
    expect(availableBatch.remainingQuantity).toBe(2);
  });
});
