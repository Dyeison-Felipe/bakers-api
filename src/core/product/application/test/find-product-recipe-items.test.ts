import { FindProductRecipeUseCase } from '../usecase/find-product-recipe-items.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import {
  makeLoggedUser,
  makeProductAdditionalCost,
  makeProductRecipeItem,
  makeProductRecipeLink,
  makeRecipeItem,
} from './fixtures';
import type { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import type { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import type { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { Product } from '../../domain/entities/product.entity';

describe('FindProductRecipeUseCase', () => {
  let productRecipeItemRepository: jest.Mocked<Pick<ProductRecipeItemRepository, 'findAllByProductId'>>;
  let productAdditionalCostRepository: jest.Mocked<Pick<ProductAdditionalCostRepository, 'findAllByProductId'>>;
  let productRecipeLinkRepository: jest.Mocked<Pick<ProductRecipeLinkRepository, 'findAllByProductId'>>;
  let recipeItemRepository: jest.Mocked<Pick<RecipeItemRepository, 'findAllByRecipeId'>>;
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findProductByIdAndCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindProductRecipeUseCase;

  beforeEach(() => {
    productRecipeItemRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    productAdditionalCostRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    productRecipeLinkRepository = { findAllByProductId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeId: jest.fn().mockResolvedValue([]) };
    productRepository = {
      findProductByIdAndCompanyId: jest.fn().mockResolvedValue({ id: 'product-1' } as Product),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindProductRecipeUseCase(
      productRecipeItemRepository as unknown as ProductRecipeItemRepository,
      productAdditionalCostRepository as unknown as ProductAdditionalCostRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should return empty lists when the product has no recipe data', async () => {
    const output = await sut.execute({ productId: 'product-1' });

    expect(output).toEqual({ recipeItems: [], additionalCost: [], recipeLinks: [] });
  });

  it('should throw NotFoundError when the product does not belong to the logged company', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should scope the product lookup to the logged company (tenant isolation)', async () => {
    await sut.execute({ productId: 'product-1' });

    expect(productRepository.findProductByIdAndCompanyId).toHaveBeenCalledWith(
      'product-1',
      'company-1',
    );
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
