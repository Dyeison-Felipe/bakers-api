import { MarkDailyProductionItemAsProducedUseCase } from '../usecase/mark-item-as-produced.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { CreateBatchUseCase } from '@/core/batch/application/usecase/create-batch.usecase';

describe('MarkDailyProductionItemAsProducedUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findById' | 'update'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction' | 'update' | 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let createBatchUseCase: jest.Mocked<Pick<CreateBatchUseCase, 'execute'>>;
  let sut: MarkDailyProductionItemAsProducedUseCase;

  beforeEach(() => {
    dailyProductionRepository = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    dailyProductionItemRepository = {
      findByIdWithDailyProduction: jest.fn().mockResolvedValue(makeItem()),
      update: jest.fn().mockResolvedValue(undefined),
      findAllByDailyProductionId: jest.fn().mockResolvedValue([]),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    createBatchUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'batch-1' }),
    };

    sut = new MarkDailyProductionItemAsProducedUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
      createBatchUseCase as unknown as CreateBatchUseCase,
    );
  });

  it('should throw NotFoundError when the item does not exist', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(null);

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the item is already produced', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for a weight-based item without an actual weight', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ unitOfMeasurement: TypeUnitOfMeasurement.KG }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should create a batch with the actual weight for weight-based items', async () => {
    const item = makeItem({ unitOfMeasurement: TypeUnitOfMeasurement.KG });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id, actualWeight: 4.5 });

    expect(createBatchUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4.5, dailyProductionItemId: item.id }),
    );
    expect(item.actualWeight).toBe(4.5);
    expect(item.actualQuantity).toBeNull();
  });

  it('should create a batch with the planned quantity for unit-based items', async () => {
    const item = makeItem({ unitOfMeasurement: TypeUnitOfMeasurement.UN, plannedQuantity: 20 });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id });

    expect(createBatchUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 20 }),
    );
    expect(item.actualQuantity).toBe(20);
  });

  it('should mark the item as produced and persist it', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    const output = await sut.execute({ id: item.id });

    expect(item.status).toBe(TypeDailyProductionItemStatus.PRODUCED);
    expect(output).toEqual({ id: item.id, batchId: 'batch-1' });
    expect(dailyProductionItemRepository.update).toHaveBeenCalledWith(item);
  });

  it('should complete the daily production when this was the last planned item', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
    ]);
    dailyProductionRepository.findById.mockResolvedValue(item.dailyProduction);

    await sut.execute({ id: item.id });

    expect(dailyProductionRepository.update).toHaveBeenCalled();
  });
});
