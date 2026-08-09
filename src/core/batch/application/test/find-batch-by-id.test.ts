import { FindBatchByIdUseCase } from '../usecase/find-batch-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeBatch, makeLoggedUser } from './fixtures';
import type { BatchRepository } from '../../domain/repositories/batch.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindBatchByIdUseCase', () => {
  let batchRepository: jest.Mocked<Pick<BatchRepository, 'findByIdAndCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindBatchByIdUseCase;

  beforeEach(() => {
    batchRepository = { findByIdAndCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindBatchByIdUseCase(
      batchRepository as unknown as BatchRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the batch does not exist for the logged company', async () => {
    batchRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'batch-1' })).rejects.toThrow(NotFoundError);
  });

  it('should scope the lookup by the logged user company id', async () => {
    const batch = makeBatch();
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    await sut.execute({ id: batch.id });

    expect(batchRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      batch.id,
      'company-1',
    );
  });

  it('should map the batch entity to the output shape', async () => {
    const batch = makeBatch({
      quantity: 20,
      remainingQuantity: 12,
      dailyProductionItemId: '11111111-1111-4111-8111-111111111111',
    });
    batchRepository.findByIdAndCompanyId.mockResolvedValue(batch);

    const output = await sut.execute({ id: batch.id });

    expect(output).toEqual({
      id: batch.id,
      product: { id: batch.product!.id, name: batch.product!.name },
      quantity: 20,
      remainingQuantity: 12,
      unitOfMeasurement: batch.unitOfMeasurement,
      productionDate: batch.productionDate,
      expirationDate: batch.expirationDate,
      dailyProductionItemId: '11111111-1111-4111-8111-111111111111',
      createdAt: batch.auditable!.createdAt,
    });
  });
});
