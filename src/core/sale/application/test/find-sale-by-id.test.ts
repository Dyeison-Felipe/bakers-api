import { FindSaleByIdUseCase } from '../usecase/find-sale-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeSale, makeSaleItem } from './fixtures';
import type { SaleRepository } from '../../domain/repositories/sale.repository';
import type { SaleItemRepository } from '../../domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindSaleByIdUseCase', () => {
  let saleRepository: jest.Mocked<Pick<SaleRepository, 'findByIdAndCompanyId'>>;
  let saleItemRepository: jest.Mocked<Pick<SaleItemRepository, 'findAllBySaleId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindSaleByIdUseCase;

  beforeEach(() => {
    saleRepository = { findByIdAndCompanyId: jest.fn() };
    saleItemRepository = { findAllBySaleId: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindSaleByIdUseCase(
      saleRepository as unknown as SaleRepository,
      saleItemRepository as unknown as SaleItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the sale does not exist for the logged company', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'sale-1' })).rejects.toThrow(NotFoundError);
  });

  it('should flag hasReceipt as true when a receipt was generated', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale({ receiptPdfPath: 'r.pdf' }));

    const output = await sut.execute({ id: 'sale-1' });

    expect(output.hasReceipt).toBe(true);
  });

  it('should flag hasReceipt as false when there is no receipt', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale({ receiptPdfPath: null }));

    const output = await sut.execute({ id: 'sale-1' });

    expect(output.hasReceipt).toBe(false);
  });

  it('should map sale items to the output shape', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale());
    saleItemRepository.findAllBySaleId.mockResolvedValue([makeSaleItem()]);

    const output = await sut.execute({ id: 'sale-1' });

    expect(output.items).toEqual([
      {
        id: 'sale-item-1',
        product: { id: 'product-1', name: 'Pão Francês' },
        unitOfMeasurement: 'un',
        quantity: 2,
        weightInKg: null,
        unitPriceSnapshot: 1,
        subtotal: 2,
      },
    ]);
  });
});
