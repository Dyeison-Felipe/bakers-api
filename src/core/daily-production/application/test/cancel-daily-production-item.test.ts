import { CancelDailyProductionItemUseCase } from '../usecase/cancel-daily-production-item.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { makeCompany, makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CancelDailyProductionItemUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findById' | 'update'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction' | 'update' | 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CancelDailyProductionItemUseCase;

  beforeEach(() => {
    dailyProductionRepository = {
      findById: jest.fn().mockResolvedValue(makeDailyProduction()),
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

    sut = new CancelDailyProductionItemUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the item does not exist', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(null);

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the item belongs to another company', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ dailyProduction: makeDailyProduction({ company: makeCompany({ id: 'other' }) }) }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the item is not PLANNED', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({
        dailyProduction: makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
      }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should cancel the item and persist it', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id });

    expect(item.status).toBe(TypeDailyProductionItemStatus.CANCELLED);
    expect(dailyProductionItemRepository.update).toHaveBeenCalledWith(item);
  });

  it('should complete the daily production when all remaining items are already produced', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
      makeItem({ status: TypeDailyProductionItemStatus.CANCELLED }),
    ]);

    await sut.execute({ id: item.id });

    expect(dailyProductionRepository.update).toHaveBeenCalled();
  });

  it('should not complete the daily production when there are still planned items', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ status: TypeDailyProductionItemStatus.PLANNED }),
    ]);

    await sut.execute({ id: item.id });

    expect(dailyProductionRepository.update).not.toHaveBeenCalled();
  });

  it('should not complete the daily production when no items were ever produced', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ status: TypeDailyProductionItemStatus.CANCELLED }),
    ]);

    await sut.execute({ id: item.id });

    expect(dailyProductionRepository.update).not.toHaveBeenCalled();
  });
});
