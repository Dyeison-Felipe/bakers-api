import { NotFoundException } from '@nestjs/common';
import { UpdateProductUseCase } from '../usecase/update-product.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { TypeProduct, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  makeCategory,
  makeLoggedUser,
  makeProduct,
  makeProductAdditionalCost,
  makeProductRecipeItem,
  makeProductRecipeLink,
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

describe('UpdateProductUseCase', () => {
  let productRepository: jest.Mocked<
    Pick<
      ProductRepository,
      | 'findProductByIdAndCompanyId'
      | 'findProductByBarCodeAndCompanyId'
      | 'findAllByIdsAndCompanyId'
      | 'update'
    >
  >;
  let categoryRepository: jest.Mocked<Pick<CategoryRepository, 'findCategoryByIdAndCompanyId'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'saveProductImage' | 'deleteProductImage'>>;
  let productRecipeItemRepository: jest.Mocked<
    Pick<ProductRecipeItemRepository, 'findAllByProductId' | 'deleteById' | 'save'>
  >;
  let productAdditionalCostRepository: jest.Mocked<
    Pick<ProductAdditionalCostRepository, 'findAllByProductId' | 'delete' | 'save' | 'update'>
  >;
  let additionalCostRepository: jest.Mocked<Pick<AdditionalCostRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeRepository: jest.Mocked<Pick<RecipeRepository, 'findAllByIdsAndCompanyId'>>;
  let recipeItemRepository: jest.Mocked<Pick<RecipeItemRepository, 'findAllByRecipeIds'>>;
  let productRecipeLinkRepository: jest.Mocked<
    Pick<ProductRecipeLinkRepository, 'findAllByProductId' | 'delete' | 'save'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: UpdateProductUseCase;

  const baseInput = {
    id: 'product-1',
    name: 'Pão Francês',
    ncm: '19059000',
    costPrice: 10,
    unitCostPrice: 0.5,
    pricePerKilogram: null,
    typeProduct: TypeProduct.OWN_PRODUCTION,
    stockManagement: true,
    active: true,
    category: 'category-1',
    expirationDateInDays: '3',
    quantity: 100,
    weight: 10,
  };

  beforeEach(() => {
    productRepository = {
      findProductByIdAndCompanyId: jest.fn().mockResolvedValue(makeProduct({ id: 'product-1' })),
      findProductByBarCodeAndCompanyId: jest.fn().mockResolvedValue(null),
      findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    categoryRepository = {
      findCategoryByIdAndCompanyId: jest.fn().mockResolvedValue(makeCategory()),
    };
    storageService = { saveProductImage: jest.fn(), deleteProductImage: jest.fn() };
    productRecipeItemRepository = {
      findAllByProductId: jest.fn().mockResolvedValue([]),
      deleteById: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    };
    productAdditionalCostRepository = {
      findAllByProductId: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    additionalCostRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeRepository = { findAllByIdsAndCompanyId: jest.fn().mockResolvedValue([]) };
    recipeItemRepository = { findAllByRecipeIds: jest.fn().mockResolvedValue([]) };
    productRecipeLinkRepository = {
      findAllByProductId: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new UpdateProductUseCase(
      productRepository as unknown as ProductRepository,
      categoryRepository as unknown as CategoryRepository,
      loggedUserService,
      storageService as unknown as StorageService,
      productRecipeItemRepository as unknown as ProductRecipeItemRepository,
      productAdditionalCostRepository as unknown as ProductAdditionalCostRepository,
      additionalCostRepository as unknown as AdditionalCostRepository,
      recipeRepository as unknown as RecipeRepository,
      recipeItemRepository as unknown as RecipeItemRepository,
      productRecipeLinkRepository as unknown as ProductRecipeLinkRepository,
    );
  });

  it('should throw NotFoundException when the product does not exist', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when the category does not exist', async () => {
    categoryRepository.findCategoryByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictError when the bar code is already used by another product', async () => {
    productRepository.findProductByBarCodeAndCompanyId.mockResolvedValue(
      makeProduct({ id: 'other-product' }),
    );

    await expect(sut.execute({ ...baseInput, barCode: '1234567890123' })).rejects.toThrow(
      ConflictError,
    );
  });

  it('should throw NotFoundError when a raw material is not found', async () => {
    await expect(
      sut.execute({ ...baseInput, productMaterial: [{ id: 'missing', quantity: 1 }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when an additional cost is not found', async () => {
    await expect(
      sut.execute({ ...baseInput, additionalCost: [{ id: 'missing', value: 1 }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when a linked recipe is not found', async () => {
    await expect(
      sut.execute({ ...baseInput, recipeLinks: [{ id: 'missing' }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should remove a recipe item whose material is no longer in the incoming list', async () => {
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([
      makeProductRecipeItem({ id: 'old-item', material: { id: 'old-mat' } }),
    ]);

    await sut.execute({ ...baseInput, productMaterial: [] });

    expect(productRecipeItemRepository.deleteById).toHaveBeenCalledWith('old-item');
  });

  it('should update the quantity of an existing recipe item when it changed', async () => {
    productRepository.findAllByIdsAndCompanyId.mockResolvedValue([
      makeProduct({ id: 'mat-1', consumerUnit: 'kg', pricePerKilogram: 4 }),
    ]);
    const existingItem = makeProductRecipeItem({
      id: 'item-1',
      material: { id: 'mat-1' },
      quantity: 1,
    });
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([existingItem]);

    await sut.execute({ ...baseInput, productMaterial: [{ id: 'mat-1', quantity: 3 }] });

    expect(existingItem.quantity).toBe(3);
    expect(productRecipeItemRepository.save).toHaveBeenCalledWith(existingItem);
  });

  it('should update the value of an existing additional cost when it changed', async () => {
    additionalCostRepository.findAllByIdsAndCompanyId.mockResolvedValue([{ id: 'ac-1' } as never]);
    const existingCost = makeProductAdditionalCost({
      id: 'cost-1',
      additionalCost: { id: 'ac-1' },
      value: 2,
    });
    productAdditionalCostRepository.findAllByProductId.mockResolvedValue([existingCost]);

    await sut.execute({ ...baseInput, additionalCost: [{ id: 'ac-1', value: 9 }] });

    expect(existingCost.value).toBe(9);
    expect(productAdditionalCostRepository.update).toHaveBeenCalledWith(existingCost);
  });

  it('should remove a recipe link that is no longer in the incoming list', async () => {
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      makeProductRecipeLink({ id: 'link-1', recipe: { id: 'old-recipe' } }),
    ]);

    await sut.execute({ ...baseInput, recipeLinks: [] });

    expect(productRecipeLinkRepository.delete).toHaveBeenCalledWith('link-1');
  });

  it('should create a new recipe link when a new recipe id is informed', async () => {
    recipeRepository.findAllByIdsAndCompanyId.mockResolvedValue([makeRecipe({ id: 'recipe-1' })]);
    recipeItemRepository.findAllByRecipeIds.mockResolvedValue([
      makeRecipeItem({ quantity: 1, material: { consumerUnit: 'kg', pricePerKilogram: 3 } }),
    ]);

    await sut.execute({ ...baseInput, recipeLinks: [{ id: 'recipe-1' }] });

    expect(productRecipeLinkRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should delete every recipe item, additional cost and recipe link when the product stops being own-production', async () => {
    productRecipeItemRepository.findAllByProductId.mockResolvedValue([
      makeProductRecipeItem({ id: 'item-1' }),
    ]);
    productAdditionalCostRepository.findAllByProductId.mockResolvedValue([
      makeProductAdditionalCost({ id: 'cost-1' }),
    ]);
    productRecipeLinkRepository.findAllByProductId.mockResolvedValue([
      makeProductRecipeLink({ id: 'link-1' }),
    ]);

    await sut.execute({
      ...baseInput,
      typeProduct: TypeProduct.RAW_MATERIAL,
      expirationDateInDays: undefined,
    });

    expect(productRecipeItemRepository.deleteById).toHaveBeenCalledWith('item-1');
    expect(productAdditionalCostRepository.delete).toHaveBeenCalledWith('cost-1');
    expect(productRecipeLinkRepository.delete).toHaveBeenCalledWith('link-1');
  });

  it('should update the product and return its id', async () => {
    const output = await sut.execute(baseInput);

    expect(output).toEqual({ id: 'product-1' });
    expect(productRepository.update).toHaveBeenCalled();
  });

  it('should replace the image when a new one is sent, deleting the previous file', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ id: 'product-1', imagePath: 'old.png' }),
    );
    storageService.saveProductImage.mockReturnValue('new.png');

    await sut.execute({
      ...baseInput,
      image: { buffer: Buffer.from('x') } as never,
    });

    expect(storageService.deleteProductImage).toHaveBeenCalledWith('company-1', 'old.png');
    expect(storageService.saveProductImage).toHaveBeenCalled();
  });

  it('should force stockManagement to false for a kg product even when input requests true', async () => {
    await sut.execute({
      ...baseInput,
      unitOfMeasurement: TypeUnitOfMeasurement.KG,
      stockManagement: true,
    });

    const updatedProduct = productRepository.update.mock.calls[0][0];
    expect(updatedProduct.stockManagement).toBe(false);
  });

  it('should force stockManagement to false when the existing product is kg and input omits unitOfMeasurement', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ id: 'product-1', unitOfMeasurement: TypeUnitOfMeasurement.KG }),
    );

    await sut.execute({ ...baseInput, unitOfMeasurement: undefined, stockManagement: true });

    const updatedProduct = productRepository.update.mock.calls[0][0];
    expect(updatedProduct.stockManagement).toBe(false);
  });
});
