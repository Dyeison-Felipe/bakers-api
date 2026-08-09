import { FindDailyProductionItemRequirementsUseCase } from '../usecase/find-daily-production-item-requirements.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeUnitOfMeasurement, TypeConsumptionUnit } from '@/shared/infra/enums/product';
import { makeCompany, makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { ProductRecipeItemRepository } from '@/core/product/domain/repositories/product-recipe-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindDailyProductionItemRequirementsUseCase', () => {
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction'>
  >;
  let productRecipeItemRepository: jest.Mocked<
    Pick<ProductRecipeItemRepository, 'findAllByProductId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindDailyProductionItemRequirementsUseCase;

  beforeEach(() => {
    dailyProductionItemRepository = {
      findByIdWithDailyProduction: jest.fn().mockResolvedValue(makeItem()),
    };
    productRecipeItemRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindDailyProductionItemRequirementsUseCase(
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      productRecipeItemRepository as unknown as ProductRecipeItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the item does not exist or belongs to another company', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ dailyProduction: makeDailyProduction({ company: makeCompany({ id: 'other' }) }) }),
    );

    await expect(sut.execute({ itemId: 'item-1' })).rejects.toThrow(NotFoundError);
  });

  it('should scale required quantity by recipeMultiplier for weight-based items', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      recipeMultiplier: 2,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([
      {
        quantity: 100,
        material: { id: 'mat-1', name: 'Farinha', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    expect(output.items).toEqual([
      {
        materialId: 'mat-1',
        materialName: 'Farinha',
        recipeQuantity: 100,
        requiredQuantity: 200, // 100 * 2
        consumerUnit: TypeConsumptionUnit.KG,
      },
    ]);
  });

  it('should scale required quantity by (plannedQuantity / product.quantity) for unit-based items', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      plannedQuantity: 20,
      product: { id: 'product-1', quantity: 10 } as never,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([
      {
        quantity: 50,
        material: { id: 'mat-1', name: 'Açúcar', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    // multiplier = plannedQuantity(20) / product.quantity(10) = 2
    expect(output.items[0].requiredQuantity).toBe(100); // 50 * 2
  });

  it('should return zero required quantity when the product has no recipe yield quantity', async () => {
    const item = makeItem({
      unitOfMeasurement: TypeUnitOfMeasurement.UN,
      plannedQuantity: 20,
      product: { id: 'product-1', quantity: null } as never,
    });
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([
      { quantity: 50, material: { id: 'mat-1', name: 'Açúcar', consumerUnit: TypeConsumptionUnit.KG } } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    expect(output.items[0].requiredQuantity).toBe(0);
  });

  it('should return an empty items list when the product has no recipe', async () => {
    const output = await sut.execute({ itemId: 'item-1' });

    expect(output.items).toEqual([]);
  });
});
