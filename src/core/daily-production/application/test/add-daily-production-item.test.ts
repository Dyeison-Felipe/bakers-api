import { AddDailyProductionItemUseCase } from '../usecase/add-daily-production-item.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { TypeUnitOfMeasurement, TypeProduct } from '@/shared/infra/enums/product';
import { makeDailyProduction, makeLoggedUser, makeProduct } from './fixtures';
import type { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('AddDailyProductionItemUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findByIdAndCompanyId'>
  >;
  let dailyProductionItemRepository: jest.Mocked<Pick<DailyProductionItemRepository, 'save'>>;
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findProductByIdAndCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: AddDailyProductionItemUseCase;

  const baseInput = { dailyProductionId: 'daily-production-1', productId: 'product-1' };

  beforeEach(() => {
    dailyProductionRepository = {
      findByIdAndCompanyId: jest.fn().mockResolvedValue(makeDailyProduction()),
    };
    dailyProductionItemRepository = {
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
    };
    productRepository = {
      findProductByIdAndCompanyId: jest.fn().mockResolvedValue(makeProduct()),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new AddDailyProductionItemUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      productRepository as unknown as ProductRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the daily production does not exist for the logged company', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ ...baseInput, plannedQuantity: 10 }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionRepository.findByIdAndCompanyId.mockResolvedValue(
      makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
    );

    await expect(
      sut.execute({ ...baseInput, plannedQuantity: 10 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw NotFoundError when the product does not exist', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ ...baseInput, plannedQuantity: 10 }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the product is not own-production', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ typeProduct: TypeProduct.RESALE }),
    );

    await expect(
      sut.execute({ ...baseInput, plannedQuantity: 10 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the product has no unit of measurement', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ unitOfMeasurement: null }),
    );

    await expect(
      sut.execute({ ...baseInput, plannedQuantity: 10 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow adding an item even when the product has no stock management enabled (e.g. kg products)', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ stockManagement: false }),
    );

    const output = await sut.execute({ ...baseInput, plannedQuantity: 10 });

    expect(output.id).toEqual(expect.any(String));
  });

  it('should propagate the BadRequestError from the cost calculator when quantity is missing for a unit-based product', async () => {
    await expect(sut.execute(baseInput)).rejects.toThrow(BadRequestError);
  });

  it('should create a unit-based item with plannedCost = unitCostPrice * plannedQuantity', async () => {
    const output = await sut.execute({ ...baseInput, plannedQuantity: 10 });

    expect(output.id).toEqual(expect.any(String));
    const savedItem = dailyProductionItemRepository.save.mock.calls[0][0];
    expect(savedItem.plannedCost).toBe(5); // unitCostPrice 0.5 * 10
    expect(savedItem.plannedQuantity).toBe(10);
    expect(savedItem.recipeMultiplier).toBeNull();
  });

  it('should create a weight-based item with plannedWeight/plannedCost from the recipe multiplier', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({
        unitOfMeasurement: TypeUnitOfMeasurement.KG,
        weight: 2,
        pricePerKilogram: 10,
      }),
    );

    const output = await sut.execute({ ...baseInput, recipeMultiplier: 3 });

    expect(output.id).toEqual(expect.any(String));
    const savedItem = dailyProductionItemRepository.save.mock.calls[0][0];
    expect(savedItem.plannedWeight).toBe(6); // 3 * 2
    expect(savedItem.plannedCost).toBe(60); // 10 * 6
    expect(savedItem.plannedQuantity).toBeNull();
  });
});
