import { CalculateRecipeCostUseCase } from '../usecase/calculate-recipe-cost.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeProduct, makeRecipe, makeRecipeItem } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import type { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CalculateRecipeCostUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findAllByIdsAndCompanyId'>>;
  let additionalCostRepository: jest.Mocked<Pick<AdditionalCostRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeRepository: jest.Mocked<Pick<RecipeRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeItemRepository: jest.Mocked<Pick<RecipeItemRepository, 'findAllByRecipeIds'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CalculateRecipeCostUseCase;

  beforeEach(() => {
    productRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    additionalCostRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeIds: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new CalculateRecipeCostUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
      additionalCostRepository as unknown as AdditionalCostRepository,
      recipeRepository as unknown as RecipeRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
    );
  });

  it('should return zero cost when nothing is informed', async () => {
    const output = await sut.execute({});

    expect(output).toEqual({ costPrice: 0 });
  });

  it('should sum material usage cost', async () => {
    productRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      makeProduct({ id: 'mat-1', consumerUnit: 'kg', pricePerKilogram: 4 }),
    ]);

    const output = await sut.execute({ productMaterial: [{ id: 'mat-1', quantity: 2 }] });

    expect(output.costPrice).toBe(8);
  });

  it('should throw NotFoundError when a material is not found', async () => {
    productRepository.findAllByIdsAndCompanyId.mockResolvedValue([]);

    await expect(
      sut.execute({ productMaterial: [{ id: 'missing', quantity: 1 }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should sum additional cost values', async () => {
    additionalCostRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      { id: 'ac-1' } as never,
    ]);

    const output = await sut.execute({ additionalCosts: [{ id: 'ac-1', value: 5 }] });

    expect(output.costPrice).toBe(5);
  });

  it('should throw NotFoundError when an additional cost is not found', async () => {
    additionalCostRepository.findAllByIdsAndCompanyId.mockResolvedValue([]);

    await expect(
      sut.execute({ additionalCosts: [{ id: 'missing', value: 5 }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should sum linked recipe items cost', async () => {
    recipeRepository.findAllByIdsAndCompanyId.mockResolvedValue([makeRecipe({ id: 'recipe-1' })]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      makeRecipeItem({
        quantity: 2,
        material: makeProduct({ consumerUnit: 'kg', pricePerKilogram: 3 }),
      }),
    ]);

    const output = await sut.execute({ recipeLinks: [{ id: 'recipe-1' }] });

    expect(output.costPrice).toBe(6);
  });

  it('should throw NotFoundError when a linked recipe is not found', async () => {
    recipeRepository.findAllByIdsAndCompanyId.mockResolvedValue([]);

    await expect(
      sut.execute({ recipeLinks: [{ id: 'missing' }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should sum materials, additional costs and recipe links together', async () => {
    productRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      makeProduct({ id: 'mat-1', consumerUnit: 'kg', pricePerKilogram: 4 }),
    ]);
    additionalCostRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      { id: 'ac-1' } as never,
    ]);
    recipeRepository.findAllByIdsAndCompanyId.mockResolvedValue([makeRecipe({ id: 'recipe-1' })]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      makeRecipeItem({
        quantity: 1,
        material: makeProduct({ consumerUnit: 'kg', pricePerKilogram: 3 }),
      }),
    ]);

    const output = await sut.execute({
      productMaterial: [{ id: 'mat-1', quantity: 2 }], // 8
      additionalCosts: [{ id: 'ac-1', value: 5 }], // 5
      recipeLinks: [{ id: 'recipe-1' }], // 3
    });

    expect(output.costPrice).toBe(16);
  });
});
