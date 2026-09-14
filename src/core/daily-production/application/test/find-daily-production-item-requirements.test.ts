import { FindDailyProductionItemRequirementsUseCase } from '../usecase/find-daily-production-item-requirements.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeUnitOfMeasurement, TypeConsumptionUnit } from '@/shared/infra/enums/product';
import { makeCompany, makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindDailyProductionItemRequirementsUseCase', () => {
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction'>
  >;
  let productRecipeLinkRepository: jest.Mocked<
    Pick<ProductRecipeLinkRepository, 'findAllByProductId'>
  >;
  let recipeItemRepository: jest.Mocked<
    Pick<RecipeItemRepository, 'findAllByRecipeIds'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindDailyProductionItemRequirementsUseCase;

  beforeEach(() => {
    dailyProductionItemRepository = {
      findByIdWithDailyProduction: jest.fn().mockResolvedValue(makeItem()),
    };
    productRecipeLinkRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeIds: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindDailyProductionItemRequirementsUseCase(
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
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
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      {
        quantity: 100,
        material: { id: 'mat-1', name: 'Farinha', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    expect(recipeItemRepository.findAllByRecipeIds).toHaveBeenCalledWith(['recipe-1']);
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
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
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
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      { recipe: { id: 'recipe-1' } } as never,
    ]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      { quantity: 50, material: { id: 'mat-1', name: 'Açúcar', consumerUnit: TypeConsumptionUnit.KG } } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    expect(output.items[0].requiredQuantity).toBe(0);
  });

  it('should return an empty items list when the product has no recipe linked', async () => {
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([]);

    const output = await sut.execute({ itemId: 'item-1' });

    expect(output.items).toEqual([]);
    expect(recipeItemRepository.findAllByRecipeIds).not.toHaveBeenCalled();
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
      {
        quantity: 30,
        material: { id: 'mat-1', name: 'Farinha', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
      {
        quantity: 20,
        material: { id: 'mat-1', name: 'Farinha', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
      {
        quantity: 5,
        material: { id: 'mat-2', name: 'Açúcar', consumerUnit: TypeConsumptionUnit.KG },
      } as never,
    ]);

    const output = await sut.execute({ itemId: item.id });

    expect(recipeItemRepository.findAllByRecipeIds).toHaveBeenCalledWith(['recipe-1', 'recipe-2']);
    expect(output.items).toEqual(
      expect.arrayContaining([
        {
          materialId: 'mat-1',
          materialName: 'Farinha',
          recipeQuantity: 50, // 30 + 20 somados entre as duas receitas
          requiredQuantity: 50,
          consumerUnit: TypeConsumptionUnit.KG,
        },
        {
          materialId: 'mat-2',
          materialName: 'Açúcar',
          recipeQuantity: 5,
          requiredQuantity: 5,
          consumerUnit: TypeConsumptionUnit.KG,
        },
      ]),
    );
    expect(output.items).toHaveLength(2);
  });
});
