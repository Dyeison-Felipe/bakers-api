import { FindAllDailyProductionsUseCase } from '../usecase/find-all-daily-productions.usecase';
import { makeDailyProduction, makeItem, makeLoggedUser, makePagination } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllDailyProductionsUseCase', () => {
  let dailyProductionRepository: jest.Mocked<Pick<DailyProductionRepository, 'findAllByCompanyId'>>;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllDailyProductionsUseCase;

  beforeEach(() => {
    dailyProductionRepository = { findAllByCompanyId: jest.fn() };
    dailyProductionItemRepository = { findAllByDailyProductionId: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllDailyProductionsUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should scope the query by the logged user company id and forward filters/pagination', async () => {
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(makePagination([]));

    await sut.execute({ page: 2, limit: 5 });

    expect(dailyProductionRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { status: undefined, productionDate: undefined },
      { page: 2, limit: 5 },
    );
  });

  it('should sum plannedCost and count items for each daily production', async () => {
    const dp = makeDailyProduction({ id: 'dp-1' });
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([dp]),
    );
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      makeItem({ plannedCost: 10 }),
      makeItem({ plannedCost: 15 }),
    ]);

    const output = await sut.execute({});

    expect(output.items[0]).toMatchObject({
      id: 'dp-1',
      totalPlannedCost: 25,
      itemCount: 2,
    });
  });

  it('should return zero totals for a daily production with no items', async () => {
    dailyProductionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([makeDailyProduction()]),
    );

    const output = await sut.execute({});

    expect(output.items[0].totalPlannedCost).toBe(0);
    expect(output.items[0].itemCount).toBe(0);
  });
});
