import { RegisterManualStockMovementUseCase } from '../usecase/register-manual-stock-movement.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeStockInputUnit,
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { AdjustProductStockUseCase } from '../usecase/adjust-product-stock.usecase';

describe('RegisterManualStockMovementUseCase', () => {
  let productRepository: jest.Mocked<
    Pick<ProductRepository, 'findProductByIdAndCompanyId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let adjustProductStockUseCase: jest.Mocked<
    Pick<AdjustProductStockUseCase, 'execute'>
  >;
  let sut: RegisterManualStockMovementUseCase;

  const makeProduct = (overrides: Record<string, unknown> = {}) => ({
    id: 'product-1',
    name: 'Pão francês',
    stockManagement: true,
    currentStock: 10,
    ...overrides,
  });

  beforeEach(() => {
    productRepository = {
      findProductByIdAndCompanyId: jest
        .fn()
        .mockResolvedValueOnce(makeProduct())
        .mockResolvedValueOnce(makeProduct({ currentStock: 15 })),
    };
    loggedUserService = {
      getLoggedUser: jest
        .fn()
        .mockReturnValue({ id: 'user-1', company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;
    adjustProductStockUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue({ productId: 'product-1', totalCost: 0 }),
    };

    sut = new RegisterManualStockMovementUseCase(
      productRepository as unknown as ProductRepository,
      loggedUserService,
      adjustProductStockUseCase as unknown as AdjustProductStockUseCase,
    );
  });

  it('should adjust the stock with the MANUAL_ADJUSTMENT reason and return the updated stock', async () => {
    const output = await sut.execute({
      productId: 'product-1',
      type: TypeStockMovement.ENTRY,
      quantity: 5,
      reasonDescription: '  compra  ',
    });

    expect(productRepository.findProductByIdAndCompanyId).toHaveBeenCalledWith(
      'product-1',
      'company-1',
    );
    expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith({
      productId: 'product-1',
      quantity: 5,
      type: TypeStockMovement.ENTRY,
      reason: TypeStockMovementReason.MANUAL_ADJUSTMENT,
      reasonDescription: 'compra',
    });
    expect(output).toEqual({ productId: 'product-1', currentStock: 15 });
  });

  it('should throw NotFoundError when the product does not exist (or belongs to another company)', async () => {
    productRepository.findProductByIdAndCompanyId.mockReset();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({
        productId: 'missing',
        type: TypeStockMovement.ENTRY,
        quantity: 1,
      }),
    ).rejects.toThrow(NotFoundError);
    expect(adjustProductStockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when the product has stock management disabled', async () => {
    productRepository.findProductByIdAndCompanyId.mockReset();
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ stockManagement: false }) as never,
    );

    await expect(
      sut.execute({
        productId: 'product-1',
        type: TypeStockMovement.EXIT,
        quantity: 1,
      }),
    ).rejects.toThrow(BadRequestError);
    expect(adjustProductStockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should propagate the insufficient stock error from the stock adjustment', async () => {
    adjustProductStockUseCase.execute.mockRejectedValue(
      new BadRequestError('Estoque insuficiente'),
    );

    await expect(
      sut.execute({
        productId: 'product-1',
        type: TypeStockMovement.EXIT,
        quantity: 999,
      }),
    ).rejects.toThrow('Estoque insuficiente');
  });

  describe('inputUnit (matéria-prima guardada em kg)', () => {
    // Lata de milho: comprada em pacote com 6, 200 g cada, consumida em kg.
    const cornCan = makeProduct({
      name: 'Milho em lata',
      typeProduct: TypeProduct.RAW_MATERIAL,
      consumerUnit: TypeConsumptionUnit.KG,
      purchaseUnit: TypeUnitOfPurchase.PCT,
      quantity: 6,
      weight: 0.2,
    });

    beforeEach(() => {
      productRepository.findProductByIdAndCompanyId.mockReset();
      productRepository.findProductByIdAndCompanyId.mockResolvedValue(
        cornCan as never,
      );
    });

    it('should convert units (cans) to kg using the weight per unit', async () => {
      await sut.execute({
        productId: 'product-1',
        type: TypeStockMovement.ENTRY,
        quantity: 20,
        inputUnit: TypeStockInputUnit.ITEM,
      });

      expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 4,
          reasonDescription: 'informado: 20 unidade(s)',
        }),
      );
    });

    it('should convert purchase packages to kg (items per package x weight)', async () => {
      await sut.execute({
        productId: 'product-1',
        type: TypeStockMovement.ENTRY,
        quantity: 3,
        inputUnit: TypeStockInputUnit.PURCHASE,
        reasonDescription: 'compra',
      });

      expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 3.6,
          reasonDescription: 'compra · informado: 3 pacote(s) de 6 un',
        }),
      );
    });

    it('should keep the quantity as-is when typed in the stock unit', async () => {
      await sut.execute({
        productId: 'product-1',
        type: TypeStockMovement.ENTRY,
        quantity: 1.5,
      });

      expect(adjustProductStockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 1.5, reasonDescription: null }),
      );
    });

    it('should refuse units when the product has no weight per unit', async () => {
      productRepository.findProductByIdAndCompanyId.mockReset();
      productRepository.findProductByIdAndCompanyId.mockResolvedValue({
        ...cornCan,
        weight: null,
      } as never);

      await expect(
        sut.execute({
          productId: 'product-1',
          type: TypeStockMovement.ENTRY,
          quantity: 20,
          inputUnit: TypeStockInputUnit.ITEM,
        }),
      ).rejects.toThrow(BadRequestError);
      expect(adjustProductStockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should refuse ITEM/PURCHASE for products that are not raw material', async () => {
      productRepository.findProductByIdAndCompanyId.mockReset();
      productRepository.findProductByIdAndCompanyId.mockResolvedValue({
        ...cornCan,
        typeProduct: TypeProduct.RESALE,
      } as never);

      await expect(
        sut.execute({
          productId: 'product-1',
          type: TypeStockMovement.ENTRY,
          quantity: 2,
          inputUnit: TypeStockInputUnit.PURCHASE,
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
