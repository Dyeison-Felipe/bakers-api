import { FindAllBatchesUseCase } from '../usecase/find-all-batches.usecase';
import { makeBatch, makeLoggedUser, makePagination } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllBatchesUseCase', () => {
  let batchRepository: jest.Mocked<Pick<BatchRepository, 'findAllByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllBatchesUseCase;

  beforeEach(() => {
    batchRepository = { findAllByCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllBatchesUseCase(
      batchRepository as unknown as BatchRepository,
      loggedUserService,
    );
  });

  it('should scope the query by the logged user company id and forward filters/pagination', async () => {
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    await sut.execute({
      productId: 'product-1',
      productName: 'Pão',
      onlyAvailable: true,
      page: 2,
      limit: 5,
    });

    expect(batchRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { productId: 'product-1', productName: 'Pão', onlyAvailable: true },
      { page: 2, limit: 5 },
    );
  });

  it('should map each batch to the output shape, preserving pagination meta', async () => {
    const batch = makeBatch({ quantity: 8, remainingQuantity: 8 });
    const pagination = makePagination([batch]);
    batchRepository.findAllByCompanyId.mockResolvedValue(pagination);

    const output = await sut.execute({});

    expect(output.meta).toEqual(pagination.meta);
    expect(output.items).toEqual([
      {
        id: batch.id,
        product: { id: batch.product!.id, name: batch.product!.name },
        quantity: 8,
        remainingQuantity: 8,
        unitOfMeasurement: batch.unitOfMeasurement,
        productionDate: batch.productionDate,
        expirationDate: batch.expirationDate,
        dailyProductionItemId: batch.dailyProductionItemId,
        createdAt: batch.auditable!.createdAt,
      },
    ]);
  });

  it('should return an empty items list when there are no batches', async () => {
    batchRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    const output = await sut.execute({});

    expect(output.items).toEqual([]);
  });
});
