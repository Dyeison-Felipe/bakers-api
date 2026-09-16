import { MarkDailyProductionItemAsProducedUseCase } from '../usecase/mark-item-as-produced.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { AdjustProductStockUseCase } from '@/core/stock-movement/application/usecase/adjust-product-stock.usecase';

describe('MarkDailyProductionItemAsProducedUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findById' | 'update'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction' | 'update' | 'findAllByDailyProductionId'>
  >;
  let productRecipeLinkRepository: jest.Mocked<
    Pick<ProductRecipeLinkRepository, 'findAllByProductId'>
  >;
  let recipeItemRepository: jest.Mocked<
    Pick<RecipeItemRepository, 'findAllByRecipeIds'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let adjustProductStockUseCase: jest.Mocked<Pick<AdjustProductStockUseCase, 'execute'>>;
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
    productRecipeLinkRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeIds: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    adjustProductStockUseCase = {
      execute: jest.fn().mockResolvedValue({ productId: 'product-1', totalCost: 0 }),
    };

    sut = new MarkDailyProductionItemAsProducedUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
      loggedUserService,
      adjustProductStockUseCase as unknown as AdjustProductStockUseCase,
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

  it('should register a stock entry with the actual weight for weight-based items', async () => {
    const item = makeItem({ unitOfMeasurement: TypeUnitOfMeasurement.KG });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id, actualWeight: 4.5 });

    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4.5, type: 'ENTRY', reason: 'PRODUCTION' }),
    );
    expect(item.actualWeight).toBe(4.5);
    expect(item.actualQuantity).toBeNull();
  });

  it('should register a stock entry with the planned quantity for unit-based items', async () => {
    const item = makeItem({ unitOfMeasurement: TypeUnitOfMeasurement.UN, plannedQuantity: 20 });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    await sut.execute({ id: item.id });

    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 20 }),
    );
    expect(item.actualQuantity).toBe(20);
  });

  it('should mark the item as produced and persist it', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    const output = await sut.execute({ id: item.id });

    expect(item.status).toBe(TypeDailyProductionItemStatus.PRODUCED);
    expect(output).toEqual({ id: item.id });
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

  it('should deduct recipe raw materials with stock management enabled, scaled by (plannedQuantity / product.quantity)', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      plannedQuantity: 20,
      product: { id: 'product-1', quantity: 10 } as never,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      { quantity: 50, material: { id: 'mat-1', stockManagement: true } } as never,
    ]);

    await sut.execute({ id: item.id });

    // multiplier = plannedQuantity(20) / product.quantity(10) = 2 -> 50 * 2 = 100
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'mat-1', quantity: 100, type: 'EXIT', reason: 'PRODUCTION' }),
    );
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'product-1', quantity: 20, type: 'ENTRY', reason: 'PRODUCTION' }),
    );
  });

  it('should scale raw material deduction by recipeMultiplier for weight-based items', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      recipeMultiplier: 2,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      { quantity: 100, material: { id: 'mat-1', stockManagement: true } } as never,
    ]);

    await sut.execute({ id: item.id, actualWeight: 4.5 });

    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'mat-1', quantity: 200, type: 'EXIT' }),
    );
  });

  it('should not deduct stock for raw materials with stock management disabled', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      plannedQuantity: 20,
      product: { id: 'product-1', quantity: 10 } as never,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      { quantity: 50, material: { id: 'mat-1', stockManagement: false } } as never,
    ]);

    await sut.execute({ id: item.id });

    expect(adjustProductStockUseCase.execute).not.toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'mat-1' }),
    );
    // A entrada do produto acabado continua acontecendo normalmente.
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'product-1', type: 'ENTRY' }),
    );
  });

  it('should sum quantities of the same material across multiple recipes linked to the product', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      recipeMultiplier: 1,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
      { recipe: { id: 'recipe-2' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      { quantity: 30, material: { id: 'mat-1', stockManagement: true } } as never,
      { quantity: 20, material: { id: 'mat-1', stockManagement: true } } as never,
    ]);

    await sut.execute({ id: item.id, actualWeight: 1 });

    expect(recipeItemRepository.findAllByRecipeIds).toHaveBeenCalledWith(['recipe-1', 'recipe-2']);
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'mat-1', quantity: 50, type: 'EXIT' }),
    );
  });

  it('should not look up or deduct raw materials when the product has no recipe linked', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([]);

    await sut.execute({ id: item.id });

    expect(recipeItemRepository.findAllByRecipeIds).not.toHaveBeenCalled();
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
