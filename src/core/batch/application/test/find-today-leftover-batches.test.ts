import { FindTodayLeftoverBatchesUseCase } from '../usecase/find-today-leftover-batches.usecase';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { makeBatch, makeLoggedUser, makePagination, makeProduct } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindTodayLeftoverBatchesUseCase', () => {
  let batchRepository: jest.Mocked<Pick<BatchRepository, 'findAllByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindTodayLeftoverBatchesUseCase;

  beforeEach(() => {
    batchRepository = { findAllByCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindTodayLeftoverBatchesUseCase(
      batchRepository as unknown as BatchRepository,
      loggedUserService,
    );
  });

  it('should query only available batches produced today, capped at 500', async () => {
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    await sut.execute();

    const [companyId, filters, pagination] =
      batchRepository.findAllByCompanyId.mock.calls[0];
    expect(companyId).toBe('company-1');
    expect(filters).toMatchObject({ onlyAvailable: true });
    expect(filters?.producedOn).toBeInstanceOf(Date);
    expect(pagination).toEqual({ limit: 500 });
  });

  it('should compute potentialLossValue using unitCostPrice for unit-based batches', async () => {
    const product = makeProduct({ unitCostPrice: 4 });
    const batch = makeBatch({
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      remainingQuantity: 3,
      quantity: 10,
      product,
    });
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([batch]));

    const output = await sut.execute();

    expect(output.items).toEqual([
      {
        batchId: batch.id,
        product: {
          id: product.id,
          name: product.name,
          currentStock: product.currentStock,
        },
        unitOfMeasurement: TypeUnitOfMeasurement.UN,
        producedQuantity: 10,
        remainingQuantity: 3,
        potentialLossValue: 12,
      },
    ]);
    expect(output.totalPotentialLoss).toBe(12);
  });

  it('should compute potentialLossValue using pricePerKilogram for weight-based batches', async () => {
    const product = makeProduct({ pricePerKilogram: 6 });
    const batch = makeBatch({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      remainingQuantity: 2.5,
      product,
    });
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([batch]));

    const output = await sut.execute();

    expect(output.items[0].potentialLossValue).toBe(15);
  });

  it('should sum potentialLossValue across all leftover batches for totalPotentialLoss', async () => {
    const batchA = makeBatch({
      id: 'batch-a',
      remainingQuantity: 2,
      product: makeProduct({ unitCostPrice: 5 }),
    });
    const batchB = makeBatch({
      id: 'batch-b',
      remainingQuantity: 1,
      product: makeProduct({ unitCostPrice: 3 }),
    });
    batchRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([batchA, batchB]),
    );

    const output = await sut.execute();

    expect(output.totalPotentialLoss).toBe(13);
  });

  it('should return zero total and empty items when there are no leftovers', async () => {
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    const output = await sut.execute();

    expect(output).toEqual({ items: [], totalPotentialLoss: 0 });
  });
});
