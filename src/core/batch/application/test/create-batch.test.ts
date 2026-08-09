import { CreateBatchUseCase } from '../usecase/create-batch.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeOperationStock, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';

describe('CreateBatchUseCase', () => {
  let batchRepository: jest.Mocked<Pick<BatchRepository, 'save'>>;
  let batchMovementRepository: jest.Mocked<Pick<BatchMovementRepository, 'save'>>;
  let productRepository: jest.Mocked<
    Pick<ProductRepository, 'findProductByIdAndCompanyId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let updateStockProductUseCase: jest.Mocked<Pick<UpdateStockProductUseCase, 'execute'>>;
  let sut: CreateBatchUseCase;

  beforeEach(() => {
    batchRepository = {
      save: jest.fn().mockImplementation((batch) => Promise.resolve(batch)),
    };
    batchMovementRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    productRepository = {
      findProductByIdAndCompanyId: jest.fn(),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    updateStockProductUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };

    sut = new CreateBatchUseCase(
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
        quantity: 10,
        unitOfMeasurement: TypeUnitOfMeasurement.UN,
        productionDate: new Date('2026-08-09'),
      }),
    ).rejects.toThrow(NotFoundError);

    expect(batchRepository.save).not.toHaveBeenCalled();
  });

  it('should create a batch, register an ENTRY movement and increase stock', async () => {
    const product = makeProduct({ id: 'product-1' });
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);

    const output = await sut.execute({
      productId: 'product-1',
      quantity: 25,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      productionDate: new Date('2026-08-09'),
    });

    expect(output.id).toEqual(expect.any(String));
    expect(batchRepository.save).toHaveBeenCalledTimes(1);

    const savedBatch = batchRepository.save.mock.calls[0][0];
    expect(savedBatch.quantity).toBe(25);
    expect(savedBatch.remainingQuantity).toBe(25);
    expect(savedBatch.product).toBe(product);

    expect(batchMovementRepository.save).toHaveBeenCalledTimes(1);
    const movement = batchMovementRepository.save.mock.calls[0][0];
    expect(movement.type).toBe(TypeBatchMovement.ENTRY);
    expect(movement.reason).toBe(TypeBatchMovementReason.PRODUCTION);
    expect(movement.quantity).toBe(25);

    expect(updateStockProductUseCase.execute).toHaveBeenCalledWith({
      productId: product.id,
      type: TypeOperationStock.INCREASE,
      value: 25,
    });
  });

  it('should compute the expiration date from the product expirationDateInDays', async () => {
    const product = makeProduct({ expirationDateInDays: '5' });
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);

    await sut.execute({
      productId: 'product-1',
      quantity: 1,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      productionDate: new Date('2026-08-09T00:00:00Z'),
    });

    const savedBatch = batchRepository.save.mock.calls[0][0];
    expect(savedBatch.expirationDate).toEqual(new Date('2026-08-14T00:00:00Z'));
  });

  it('should leave expirationDate null when the product has no expirationDateInDays', async () => {
    const product = makeProduct({ expirationDateInDays: null });
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);

    await sut.execute({
      productId: 'product-1',
      quantity: 1,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      productionDate: new Date('2026-08-09'),
    });

    const savedBatch = batchRepository.save.mock.calls[0][0];
    expect(savedBatch.expirationDate).toBeNull();
  });

  it('should link the batch to a daily production item when informed', async () => {
    const product = makeProduct();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(product);

    await sut.execute({
      productId: 'product-1',
      quantity: 1,
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      productionDate: new Date('2026-08-09'),
      dailyProductionItemId: '11111111-1111-4111-8111-111111111111',
    });

    const savedBatch = batchRepository.save.mock.calls[0][0];
    expect(savedBatch.dailyProductionItemId).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });
});
