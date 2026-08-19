import { AddDailyProductionItemsUseCase } from '../usecase/add-daily-production-items.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { AddDailyProductionItemUseCase } from '../usecase/add-daily-production-item.usecase';

describe('AddDailyProductionItemsUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findByIdAndCompanyId'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId' | 'update'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let addDailyProductionItemUseCase: jest.Mocked<
    Pick<AddDailyProductionItemUseCase, 'execute'>
  >;
  let sut: AddDailyProductionItemsUseCase;

  beforeEach(() => {
    dailyProductionRepository = {
      findByIdAndCompanyId: jest.fn().mockResolvedValue(makeDailyProduction()),
    };
    dailyProductionItemRepository = {
      findAllByDailyProductionId: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    addDailyProductionItemUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'new-item-1' }),
    };

    sut = new AddDailyProductionItemsUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
      addDailyProductionItemUseCase as unknown as AddDailyProductionItemUseCase,
    );
  });

  it('should throw BadRequestError when no items are informed', async () => {
    await expect(
      sut.execute({ dailyProductionId: 'daily-production-1', items: [] }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw NotFoundError when the daily production does not exist', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({
        dailyProductionId: 'missing',
        items: [{ productId: 'product-1', plannedQuantity: 10 }],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(
      makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
    );

    await expect(
      sut.execute({
        dailyProductionId: 'daily-production-1',
        items: [{ productId: 'product-1', plannedQuantity: 10 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create a new item via AddDailyProductionItemUseCase when the product is not already planned', async () => {
    const output = await sut.execute({
      dailyProductionId: 'daily-production-1',
      items: [{ productId: 'product-1', plannedQuantity: 10 }],
    });

    expect(addDailyProductionItemUseCase.execute).toHaveBeenCalledWith({
      dailyProductionId: 'daily-production-1',
      productId: 'product-1',
      plannedQuantity: 10,
      recipeMultiplier: undefined,
    });
    expect(output.itemIds).toEqual(['new-item-1']);
  });

  it('should sum plannedQuantity into an existing PLANNED unit-based item instead of creating a new one', async () => {
    const existing = makeItem({
      plannedQuantity: 10,
      unitCostPriceSnapshot: 0.5,
    });
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      existing,
    ]);

    const output = await sut.execute({
      dailyProductionId: 'daily-production-1',
      items: [{ productId: existing.product!.id, plannedQuantity: 5 }],
    });

    expect(existing.plannedQuantity).toBe(15);
    expect(existing.plannedCost).toBe(7.5); // 0.5 * 15
    expect(dailyProductionItemRepository.update).toHaveBeenCalledWith(existing);
    expect(addDailyProductionItemUseCase.execute).not.toHaveBeenCalled();
    expect(output.itemIds).toEqual([existing.id]);
  });

  it('should sum recipeMultiplier into an existing PLANNED weight-based item', async () => {
    const existing = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      plannedQuantity: null,
      recipeMultiplier: 1,
      pricePerKilogramSnapshot: 12,
      product: { id: 'product-1', weight: 3 } as never,
    });
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      existing,
    ]);

    await sut.execute({
      dailyProductionId: 'daily-production-1',
      items: [{ productId: 'product-1', recipeMultiplier: 2 }],
    });

    expect(existing.recipeMultiplier).toBe(3);
    expect(existing.plannedWeight).toBe(9); // 3 * 3
    expect(existing.plannedCost).toBe(108); // 12 * 9
  });

  it('should not sum into an item that is not PLANNED (PRODUCED/CANCELLED count as a fresh add)', async () => {
    const produced = makeItem({ status: TypeDailyProductionItemStatus.PRODUCED });
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      produced,
    ]);

    await sut.execute({
      dailyProductionId: 'daily-production-1',
      items: [{ productId: produced.product!.id, plannedQuantity: 5 }],
    });

    expect(addDailyProductionItemUseCase.execute).toHaveBeenCalled();
    expect(dailyProductionItemRepository.update).not.toHaveBeenCalled();
  });

  it('should process multiple items and return all ids', async () => {
    const existing = makeItem({ plannedQuantity: 10, unitCostPriceSnapshot: 0.5 });
    dailyProductionItemRepository.findAllByDailyProductionId.mockResolvedValue([
      existing,
    ]);
    addDailyProductionItemUseCase.execute
      .mockResolvedValueOnce({ id: 'new-item-1' })
      .mockResolvedValueOnce({ id: 'new-item-2' });

    const output = await sut.execute({
      dailyProductionId: 'daily-production-1',
      items: [
        { productId: existing.product!.id, plannedQuantity: 5 },
        { productId: 'product-2', plannedQuantity: 3 },
        { productId: 'product-3', recipeMultiplier: 1 },
      ],
    });

    expect(output.itemIds).toEqual([existing.id, 'new-item-1', 'new-item-2']);
  });
});
