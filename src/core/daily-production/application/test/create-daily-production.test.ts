import { CreateDailyProductionUseCase } from '../usecase/create-daily-production.usecase';
import { makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { AddDailyProductionItemUseCase } from '../usecase/add-daily-production-item.usecase';

describe('CreateDailyProductionUseCase', () => {
  let dailyProductionRepository: jest.Mocked<Pick<DailyProductionRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let addDailyProductionItemUseCase: jest.Mocked<Pick<AddDailyProductionItemUseCase, 'execute'>>;
  let sut: CreateDailyProductionUseCase;

  beforeEach(() => {
    dailyProductionRepository = {
      save: jest.fn().mockImplementation((dp) => Promise.resolve(dp)),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    addDailyProductionItemUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'item-1' }),
    };

    sut = new CreateDailyProductionUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      loggedUserService,
      addDailyProductionItemUseCase as unknown as AddDailyProductionItemUseCase,
    );
  });

  it('should create an open daily production for the given date', async () => {
    const output = await sut.execute({ productionDate: new Date('2026-08-09') });

    expect(output.id).toEqual(expect.any(String));
    expect(dailyProductionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should not add any items when none are informed', async () => {
    await sut.execute({ productionDate: new Date('2026-08-09') });

    expect(addDailyProductionItemUseCase.execute).not.toHaveBeenCalled();
  });

  it('should add each informed item to the newly created daily production', async () => {
    await sut.execute({
      productionDate: new Date('2026-08-09'),
      items: [
        { productId: 'product-1', plannedQuantity: 10 },
        { productId: 'product-2', recipeMultiplier: 2 },
      ],
    });

    expect(addDailyProductionItemUseCase.execute).toHaveBeenCalledTimes(2);
    expect(addDailyProductionItemUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'product-1', plannedQuantity: 10 }),
    );
  });
});
