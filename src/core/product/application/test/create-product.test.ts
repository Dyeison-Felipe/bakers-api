import { CreateProductUseCase } from '../usecase/create-product.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { TypeProduct } from '@/shared/infra/enums/product';
import {
  makeAdditionalCost,
  makeCategory,
  makeLoggedUser,
  makeProduct,
  makeRecipe,
  makeRecipeItem,
} from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import type { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import type { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import type { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import type { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import type { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CreateProductUseCase', () => {
  let productRepository: jest.Mocked<
    Pick<
      ProductRepository,
      | 'findProductByNameAndCompanyId'
      | 'findProductByBarCodeAndCompanyId'
      | 'findAllByIdsAndCompanyId'
      | 'save'
    >
  >;
  let categoryRepository: jest.Mocked<Pick<CategoryRepository, 'findCategoryByIdAndCompanyId'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'saveProductImage'>>;
  let productRecipeItemRepository: jest.Mocked<Pick<ProductRecipeItemRepository, 'save'>>;
  let productAdditionalCostRepository: jest.Mocked<Pick<ProductAdditionalCostRepository, 'save'>>;
  let additionalCostRepository: jest.Mocked<Pick<AdditionalCostRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeRepository: jest.Mocked<Pick<RecipeRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeItemRepository: jest.Mocked<Pick<RecipeItemRepository, 'findAllByRecipeIds'>>;
  let productRecipeLinkRepository: jest.Mocked<Pick<ProductRecipeLinkRepository, 'save'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CreateProductUseCase;

  const ownProductionInput = {
    name: 'Pão Francês',
    ncm: '19059000',
    costPrice: 10,
    unitCostPrice: 0.5,
    stockManagement: true,
    typeProduct: TypeProduct.OWN_PRODUCTION,
    active: true,
    category: 'category-1',
    expirationDateInDays: '3',
    quantity: 100,
    weight: 10,
  };

  beforeEach(() => {
    productRepository = {
      findProductByNameAndCompanyId: jest.fn().mockResolvedValue(null),
      findProductByBarCodeAndCompanyId: jest.fn().mockResolvedValue(null),
      findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    categoryRepository = {
      findCategoryByIdAndCompanyId: jest.fn().mockResolvedValue(makeCategory()),
    };
    storageService = { saveProductImage: jest.fn() };
    productRecipeItemRepository = { save: jest.fn().mockResolvedValue(undefined) };
    productAdditionalCostRepository = { save: jest.fn().mockResolvedValue(undefined) };
    additionalCostRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeIds: jest.fn().mockResolvedValue([]) };
    productRecipeLinkRepository = { save: jest.fn().mockResolvedValue(undefined) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new CreateProductUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
      categoryRepository as unknown as CategoryRepository,
      storageService as unknown as StorageService,
      productRecipeItemRepository as unknown as ProductRecipeItemRepository,
      productAdditionalCostRepository as unknown as ProductAdditionalCostRepository,
      additionalCostRepository as unknown as AdditionalCostRepository,
      recipeRepository as unknown as RecipeRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
    );
  });

  it('should throw BadRequestError when own-production has no expirationDateInDays', async () => {
    await expect(
      sut.execute({ ...ownProductionInput, expirationDateInDays: undefined }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ConflictError when a product with the same name already exists', async () => {
    productRepository.findProductByNameAndCompanyId.mockResolvedValue(makeProduct());

    await expect(sut.execute(ownProductionInput)).rejects.toThrow(ConflictError);
  });

  it('should throw ConflictError when the bar code is already in use', async () => {
    productRepository.findProductByBarCodeAndCompanyId.mockResolvedValue(makeProduct());

    await expect(
      sut.execute({ ...ownProductionInput, barCode: '1234567890123' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should throw NotFoundError when the category does not exist', async () => {
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute(ownProductionInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when a raw material is not found', async () => {
    await expect(
      sut.execute({
        ...ownProductionInput,
        productMaterial: [{ id: 'missing', quantity: 1 }],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when an additional cost is not found', async () => {
    await expect(
      sut.execute({
        ...ownProductionInput,
        additionalCost: [{ id: 'missing', value: 1 }],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when a linked recipe is not found', async () => {
    await expect(
      sut.execute({
        ...ownProductionInput,
        recipeLinks: [{ id: 'missing' }],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should compute costPrice from materials, additional costs and recipe links, and persist all links', async () => {
    productRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      makeProduct({ id: 'mat-1', consumerUnit: 'kg', pricePerKilogram: 4 }),
    ]);
    additionalCostRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      makeAdditionalCost({ id: 'ac-1' }),
    ]);
    recipeRepository.findAllByIdsAndCompanyId.mockResolvedValue([makeRecipe({ id: 'recipe-1' })]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      makeRecipeItem({ quantity: 1, material: { consumerUnit: 'kg', pricePerKilogram: 3 } }),
    ]);

    await sut.execute({
      ...ownProductionInput,
      productMaterial: [{ id: 'mat-1', quantity: 2 }], // 8
      additionalCost: [{ id: 'ac-1', value: 5 }], // 5
      recipeLinks: [{ id: 'recipe-1' }], // 3
    });

    const savedProduct = productRepository.save.mock.calls[0][0];
    expect(savedProduct.costPrice).toBe(16);
    expect(productRecipeItemRepository.save).toHaveBeenCalledTimes(1);
    expect(productAdditionalCostRepository.save).toHaveBeenCalledTimes(1);
    expect(productRecipeLinkRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should compute profitPrice from salePrice for an own-production product', async () => {
    await sut.execute({ ...ownProductionInput, salePrice: 5 });

    const savedProduct = productRepository.save.mock.calls[0][0];
    // unitCostPrice = costPrice(10) / quantity(100) = 0.1 -> profit = 5 - 0.1 = 4.9
    expect(savedProduct.salePrice).toBe(5);
    expect(savedProduct.profitPrice).toBeCloseTo(4.9);
  });

  it('should force salePrice and profitPrice to null for a raw material product', async () => {
    await sut.execute({
      ...ownProductionInput,
      typeProduct: TypeProduct.RAW_MATERIAL,
      expirationDateInDays: undefined,
      salePrice: 99,
    });

    const savedProduct = productRepository.save.mock.calls[0][0];
    expect(savedProduct.salePrice).toBeNull();
    expect(savedProduct.profitPrice).toBeNull();
  });

  it('should not require expirationDateInDays for a raw material product', async () => {
    const output = await sut.execute({
      ...ownProductionInput,
      typeProduct: TypeProduct.RAW_MATERIAL,
      expirationDateInDays: undefined,
    });

    expect(output.id).toBeDefined();
  });

  it('should return the created product id', async () => {
    const output = await sut.execute(ownProductionInput);

    expect(output).toEqual({ id: expect.any(String) });
  });
});
