import { FindDailyProductionByIdUseCase } from '../usecase/find-daily-production-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindDailyProductionByIdUseCase', () => {
  let dailyProductionRepository: jest.Mocked<Pick<DailyProductionRepository, 'findByIdAndCompanyId'>>;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindDailyProductionByIdUseCase;

  beforeEach(() => {
    dailyProductionRepository = { findByIdAndCompanyId: jest.fn() };
    dailyProductionItemRepository = { findAllByDailyProductionId: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindDailyProductionByIdUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the daily production does not exist for the logged company', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'dp-1' })).rejects.toThrow(NotFoundError);
  });

  it('should sum plannedCost across all items and map each item to the output shape', async () => {
    const dp = makeDailyProduction({ id: 'dp-1' });
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(dp);
    const item = makeItem({ plannedCost: 20 });
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([item]);

    const output = await sut.execute({ id: 'dp-1' });

    expect(output.totalPlannedCost).toBe(20);
    expect(output.items).toEqual([
      {
        id: item.id,
        product: { id: item.product!.id, name: item.product!.name },
        unitOfMeasurement: item.unitOfMeasurement,
        plannedQuantity: item.plannedQuantity,
        recipeMultiplier: item.recipeMultiplier,
        plannedWeight: item.plannedWeight,
        plannedCost: 20,
        status: item.status,
        actualQuantity: item.actualQuantity,
        actualWeight: item.actualWeight,
        producedAt: item.producedAt,
      },
    ]);
  });
});
