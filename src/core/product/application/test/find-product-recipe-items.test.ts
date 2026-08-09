import { FindProductRecipeUseCase } from '../usecase/find-product-recipe-items.usecase';
import {
  makeProductAdditionalCost,
  makeProductRecipeItem,
  makeProductRecipeLink,
  makeRecipeItem,
} from './fixtures';
import type { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import type { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import type { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';

describe('FindProductRecipeUseCase', () => {
  let productRecipeItemRepository: jest.Mocked<Pick<ProductRecipeItemRepository, 'findAllByProductId'>>;
  let productAdditionalCostRepository: jest.Mocked<Pick<ProductAdditionalCostRepository, 'findAllByProductId'>>;
  let productRecipeLinkRepository: jest.Mocked<Pick<ProductRecipeLinkRepository, 'findAllByProductId'>>;
  let recipeItemRepository: jest.Mocked<Pick<RecipeItemRepository, 'findAllByRecipeId'>>;
  let sut: FindProductRecipeUseCase;

  beforeEach(() => {
    productRecipeItemRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    productAdditionalCostRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    productRecipeLinkRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeId: jest.fn().mockResolvedValue([]) };

    sut = new FindProductRecipeUseCase(
      productRecipeItemRepository as unknown as ProductRecipeItemRepository,
      productAdditionalCostRepository as unknown as ProductAdditionalCostRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
    );
  });

  it('should return empty lists when the product has no recipe data', async () => {
    const output = await sut.execute({ productId: 'product-1' });

    expect(output).toEqual({ recipeItems: [], additionalCost: [], recipeLinks: [] });
  });

  it('should map recipe items and additional costs to the output shape', async () => {
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([makeProductRecipeItem()]);
    productAdditionalCostRepository.findAllByProductId.mockResolvedValue([
      makeProductAdditionalCost(),
    ]);

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.recipeItems).toEqual([
      {
        id: 'product-recipe-item-1',
        quantity: 1,
        material: {
          id: 'material-1',
          name: 'Farinha',
          imagePath: null,
          consumerUnit: 'kg',
          unitCostPrice: 4,
          pricePerKilogram: 4,
          costPrice: 10,
        },
      },
    ]);
    expect(output.additionalCost).toEqual([
      {
        id: 'product-additional-cost-1',
        value: 2,
        additionalCost: { id: 'additional-cost-1', name: 'Embalagem' },
      },
    ]);
  });

  it('should compute the cost of each linked recipe from its items', async () => {
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([makeProductRecipeLink()]);
    recipeItemRepository.findAllByRecipeId.mockResolvedValue([
      makeRecipeItem({ quantity: 2, material: { consumerUnit: 'kg', pricePerKilogram: 3 } }),
    ]);

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.recipeLinks).toEqual([
      {
        id: 'product-recipe-link-1',
        recipe: { id: 'recipe-1', name: 'Massa base', costPrice: 6 },
      },
    ]);
  });

  it('should return zero cost for a linked recipe with no items', async () => {
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([makeProductRecipeLink()]);
    recipeItemRepository.findAllByRecipeId.mockResolvedValue([]);

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.recipeLinks[0].recipe.costPrice).toBe(0);
  });
});
