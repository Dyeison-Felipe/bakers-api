import { FinalizeSaleUseCase } from '../usecase/finalize-sale.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { makeLoggedUser, makeProduct, makeSession } from './fixtures';
import type { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import type { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import type { SaleRepository } from '../../domain/repositories/sale.repository';
import type { SaleItemRepository } from '../../domain/repositories/sale-item.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import type { WriteOffBatchUseCase } from '@/core/batch/application/usecase/write-off-batch.usecase';
import type { CustomerRepository } from '@/core/customer/domain/repositories/customer.repository';

jest.mock('../services/sale-receipt-pdf.service', () => ({
  SaleReceiptPdfService: { generate: jest.fn().mockResolvedValue(Buffer.from('pdf')) },
}));

describe('FinalizeSaleUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findProductByIdAndCompanyId'>>;
  let cashRegisterSessionRepository: jest.Mocked<Pick<CashRegisterSessionRepository, 'findOpenByCompanyId'>>;
  let saleRepository: jest.Mocked<Pick<SaleRepository, 'save' | 'update'>>;
  let saleItemRepository: jest.Mocked<Pick<SaleItemRepository, 'saveMany'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'uploadBuffer'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let writeOffBatchUseCase: jest.Mocked<Pick<WriteOffBatchUseCase, 'execute'>>;
  let customerRepository: jest.Mocked<
    Pick<CustomerRepository, 'findCustomerByIdAndCompanyId'>
  >;
  let sut: FinalizeSaleUseCase;

  beforeEach(() => {
    productRepository = {
      findProductByIdAndCompanyId: jest.fn().mockResolvedValue(makeProduct()),
    };
    cashRegisterSessionRepository = {
      findOpenByCompanyId: jest.fn().mockResolvedValue(makeSession()),
    };
    saleRepository = {
      save: jest.fn().mockImplementation(async (s) => s),
      update: jest.fn().mockResolvedValue(undefined),
    };
    saleItemRepository = { saveMany: jest.fn().mockResolvedValue([]) };
    storageService = { uploadBuffer: jest.fn().mockResolvedValue('receipt.pdf') };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    writeOffBatchUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
    customerRepository = {
      findCustomerByIdAndCompanyId: jest.fn().mockResolvedValue(null),
    };

    sut = new FinalizeSaleUseCase(
      productRepository as unknown as ProductRepository,
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      saleRepository as unknown as SaleRepository,
      saleItemRepository as unknown as SaleItemRepository,
      storageService as unknown as StorageService,
      loggedUserService,
      customerRepository as unknown as CustomerRepository,
      writeOffBatchUseCase as unknown as WriteOffBatchUseCase,
    );
  });

  const oneUnitItem = { items: [{ productId: 'product-1', quantity: 2 }], paymentMethod: TypePaymentMethod.PIX };

  it('should throw BadRequestError when no items are informed', async () => {
    await expect(
      sut.execute({ items: [], paymentMethod: TypePaymentMethod.PIX }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when there is no open cash register session', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(null);

    await expect(sut.execute(oneUnitItem)).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the open session is not OPEN', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(
      makeSession({ status: TypeCashRegisterSessionStatus.CLOSED }),
    );

    await expect(sut.execute(oneUnitItem)).rejects.toThrow(BadRequestError);
  });

  it('should throw NotFoundError when a product does not exist', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute(oneUnitItem)).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the product is inactive', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(makeProduct({ active: false }));

    await expect(sut.execute(oneUnitItem)).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the product has no sale price', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(makeProduct({ salePrice: null }));

    await expect(sut.execute(oneUnitItem)).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when a unit-based item has no quantity', async () => {
    await expect(
      sut.execute({ items: [{ productId: 'product-1' }], paymentMethod: TypePaymentMethod.PIX }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when a weight-based item has no weight', async () => {
    productRepository.findProductByIdAndCompanyId.mockResolvedValue(
      makeProduct({ unitOfMeasurement: TypeUnitOfMeasurement.KG }),
    );

    await expect(
      sut.execute({ items: [{ productId: 'product-1' }], paymentMethod: TypePaymentMethod.PIX }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when paying in cash without informing the amount received', async () => {
    await expect(
      sut.execute({ items: oneUnitItem.items, paymentMethod: TypePaymentMethod.CASH }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the amount received is insufficient', async () => {
    await expect(
      sut.execute({
        items: oneUnitItem.items,
        paymentMethod: TypePaymentMethod.CASH,
        amountReceived: 1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should compute totalAmount and changeAmount for a cash sale', async () => {
    const output = await sut.execute({
      items: oneUnitItem.items, // salePrice 1 * quantity 2 = 2
      paymentMethod: TypePaymentMethod.CASH,
      amountReceived: 5,
    });

    expect(output.totalAmount).toBe(2);
    expect(output.amountReceived).toBe(5);
    expect(output.changeAmount).toBe(3);
    expect(output.receiptPdfUrl).toBe(`/v1/sale/${output.id}/receipt`);
  });

  it('should use the client-supplied unitPrice instead of the registered salePrice', async () => {
    const output = await sut.execute({
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 0.7 }],
      paymentMethod: TypePaymentMethod.PIX,
    });

    expect(output.totalAmount).toBe(1.4);
  });

  it('should throw BadRequestError when the client-supplied unitPrice is below the product cost', async () => {
    await expect(
      sut.execute({
        items: [{ productId: 'product-1', quantity: 2, unitPrice: 0.3 }],
        paymentMethod: TypePaymentMethod.PIX,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not set amountReceived/changeAmount for a non-cash sale', async () => {
    const output = await sut.execute(oneUnitItem);

    expect(output.amountReceived).toBeNull();
    expect(output.changeAmount).toBeNull();
  });

  it('should write off stock for stock-managed products only', async () => {
    productRepository.findProductByIdAndCompanyId
      .mockResolvedValueOnce(makeProduct({ id: 'product-1', stockManagement: true }))
      .mockResolvedValueOnce(makeProduct({ id: 'product-2', stockManagement: false }));

    await sut.execute({
      items: [
        { productId: 'product-1', quantity: 1 },
        { productId: 'product-2', quantity: 1 },
      ],
      paymentMethod: TypePaymentMethod.PIX,
    });

    expect(writeOffBatchUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeOffBatchUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'product-1', quantity: 1 }),
    );
  });

  it('should only accept an 11-digit customer CPF', async () => {
    saleRepository.save.mockImplementation(async (s) => s);

    await sut.execute({ ...oneUnitItem, customerCpf: '123' });

    const savedSale = saleRepository.save.mock.calls[0][0];
    expect(savedSale.customerCpf).toBeNull();
  });

  it('should link the sale to a registered customer when customerId is informed', async () => {
    const customerId = '11111111-1111-4111-8111-111111111111';
    customerRepository.findCustomerByIdAndCompanyId.mockResolvedValue({
      id: customerId,
    } as never);

    const output = await sut.execute({ ...oneUnitItem, customerId });

    const savedSale = saleRepository.save.mock.calls[0][0];
    expect(savedSale.customerId).toBe(customerId);
    expect(output.id).toBeDefined();
  });

  it('should throw NotFoundError when customerId does not belong to the company', async () => {
    customerRepository.findCustomerByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ ...oneUnitItem, customerId: 'missing-customer' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should generate and attach the receipt to the sale', async () => {
    const output = await sut.execute(oneUnitItem);

    expect(storageService.uploadBuffer).toHaveBeenCalledWith(
      'company-1',
      'sale',
      `${output.id}.pdf`,
      expect.any(Buffer),
      'application/pdf',
    );
    expect(saleRepository.update).toHaveBeenCalled();
  });
});
