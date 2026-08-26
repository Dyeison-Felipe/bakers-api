import { GetSaleReceiptUseCase } from '../usecase/get-sale-receipt.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeSale } from './fixtures';
import type { SaleRepository } from '../../domain/repositories/sale.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('GetSaleReceiptUseCase', () => {
  let saleRepository: jest.Mocked<Pick<SaleRepository, 'findByIdAndCompanyId'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'download'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: GetSaleReceiptUseCase;

  beforeEach(() => {
    saleRepository = { findByIdAndCompanyId: jest.fn() };
    storageService = {
      download: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new GetSaleReceiptUseCase(
      saleRepository as unknown as SaleRepository,
      storageService as unknown as StorageService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the sale does not exist', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ saleId: 'sale-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the sale has no receipt', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale({ receiptPdfPath: null }));

    await expect(sut.execute({ saleId: 'sale-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the storage download fails', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(
      makeSale({ receiptPdfPath: 'company/company-1/sale/r.pdf' }),
    );
    storageService.download.mockRejectedValue(new Error('not found in storage'));

    await expect(sut.execute({ saleId: 'sale-1' })).rejects.toThrow();
  });

  it('should return the receipt file buffer', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(
      makeSale({ receiptPdfPath: 'company/company-1/sale/r.pdf' }),
    );

    const output = await sut.execute({ saleId: 'sale-1' });

    expect(storageService.download).toHaveBeenCalledWith('company/company-1/sale/r.pdf');
    expect(output).toEqual({ buffer: Buffer.from('pdf-bytes') });
  });
});
