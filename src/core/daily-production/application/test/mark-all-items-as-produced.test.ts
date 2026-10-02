import { MarkAllDailyProductionItemsAsProducedUseCase } from '../usecase/mark-all-items-as-produced.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { MarkDailyProductionItemAsProducedUseCase } from '../usecase/mark-item-as-produced.usecase';

describe('MarkAllDailyProductionItemsAsProducedUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findByIdAndCompanyId'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let markDailyProductionItemAsProducedUseCase: jest.Mocked<
    Pick<MarkDailyProductionItemAsProducedUseCase, 'execute'>
  >;
  let sut: MarkAllDailyProductionItemsAsProducedUseCase;

  beforeEach(() => {
    dailyProductionRepository = {
      findByIdAndCompanyId: jest.fn().mockResolvedValue(makeDailyProduction()),
    };
    dailyProductionItemRepository = {
      findAllByDailyProductionId: jest.fn().mockResolvedValue([makeItem()]),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    markDailyProductionItemAsProducedUseCase = {
      execute: jest
        .fn()
        .mockImplementation(({ id }: { id: string }) => Promise.resolve({ id })),
    };

    sut = new MarkAllDailyProductionItemsAsProducedUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
      markDailyProductionItemAsProducedUseCase as unknown as MarkDailyProductionItemAsProducedUseCase,
    );
  });

  it('should look up the daily production scoped to the logged user company', async () => {
    await sut.execute({ dailyProductionId: 'daily-production-1' });

    expect(dailyProductionRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      'daily-production-1',
      'company-1',
    );
  });

  it('should throw NotFoundError when the daily production does not exist (or belongs to another company)', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ dailyProductionId: 'missing' }),
    ).rejects.toThrow(NotFoundError);
    expect(markDailyProductionItemAsProducedUseCase.execute).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(
      makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
    );

    await expect(
      sut.execute({ dailyProductionId: 'daily-production-1' }),
    ).rejects.toThrow(BadRequestError);
    expect(markDailyProductionItemAsProducedUseCase.execute).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when there is no PLANNED item', async () => {
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ id: 'produced', status: TypeDailyProductionItemStatus.PRODUCED }),
      makeItem({ id: 'cancelled', status: TypeDailyProductionItemStatus.CANCELLED }),
    ]);

    await expect(
      sut.execute({ dailyProductionId: 'daily-production-1' }),
    ).rejects.toThrow(BadRequestError);
    expect(markDailyProductionItemAsProducedUseCase.execute).not.toHaveBeenCalled();
  });

  it('should mark only the PLANNED items as produced', async () => {
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ id: 'planned-1' }),
      makeItem({ id: 'produced', status: TypeDailyProductionItemStatus.PRODUCED }),
      makeItem({ id: 'cancelled', status: TypeDailyProductionItemStatus.CANCELLED }),
      makeItem({ id: 'planned-2' }),
    ]);

    const output = await sut.execute({ dailyProductionId: 'daily-production-1' });

    expect(markDailyProductionItemAsProducedUseCase.execute).toHaveBeenCalledTimes(2);
    expect(markDailyProductionItemAsProducedUseCase.execute).toHaveBeenNthCalledWith(1, {
      id: 'planned-1',
    });
    expect(markDailyProductionItemAsProducedUseCase.execute).toHaveBeenNthCalledWith(2, {
      id: 'planned-2',
    });
    expect(output.itemIds).toEqual(['planned-1', 'planned-2']);
  });

  it('should propagate the error when producing one of the items fails', async () => {
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ id: 'planned-1' }),
      makeItem({ id: 'planned-2' }),
    ]);
    markDailyProductionItemAsProducedUseCase.execute
      .mockResolvedValueOnce({ id: 'planned-1' })
      .mockRejectedValueOnce(new BadRequestError('Estoque insuficiente'));

    await expect(
      sut.execute({ dailyProductionId: 'daily-production-1' }),
    ).rejects.toThrow(BadRequestError);
  });
});
