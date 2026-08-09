import { UpdateDailyProductionItemUseCase } from '../usecase/update-daily-production-item.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('UpdateDailyProductionItemUseCase', () => {
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction' | 'update'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: UpdateDailyProductionItemUseCase;

  beforeEach(() => {
    dailyProductionItemRepository = {
      findByIdWithDailyProduction: jest.fn().mockResolvedValue(makeItem()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new UpdateDailyProductionItemUseCase(
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the item does not exist', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(null);

    await expect(
      sut.execute({ id: 'item-1', plannedQuantity: 10 }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the item is not PLANNED', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
    );

    await expect(
      sut.execute({ id: 'item-1', plannedQuantity: 10 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({
        dailyProduction: makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
      }),
    );

    await expect(
      sut.execute({ id: 'item-1', plannedQuantity: 10 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should recompute plannedCost for a unit-based item using the product unit cost snapshot', async () => {
    const item = makeItem({ unitCostPriceSnapshot: 2 });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id, plannedQuantity: 15 });

    expect(item.plannedQuantity).toBe(15);
    expect(item.plannedCost).toBe(30); // 2 * 15
    expect(dailyProductionItemRepository.update).toHaveBeenCalledWith(item);
  });

  it('should recompute plannedWeight/plannedCost for a weight-based item using the recipe multiplier', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      pricePerKilogramSnapshot: 12,
      product: { weight: 3, id: 'product-1' } as never,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id, recipeMultiplier: 2 });

    expect(item.plannedWeight).toBe(6); // 2 * 3
    expect(item.plannedCost).toBe(72); // 12 * 6
  });
});
