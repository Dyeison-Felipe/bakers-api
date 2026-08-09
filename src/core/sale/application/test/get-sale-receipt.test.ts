import * as fs from 'fs';
import { GetSaleReceiptUseCase } from '../usecase/get-sale-receipt.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeSale } from './fixtures';
import type { SaleRepository } from '../../domain/repositories/sale.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

jest.mock('fs');

describe('GetSaleReceiptUseCase', () => {
  let saleRepository: jest.Mocked<Pick<SaleRepository, 'findByIdAndCompanyId'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'getSaleReceiptPath'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: GetSaleReceiptUseCase;

  beforeEach(() => {
    saleRepository = { findByIdAndCompanyId: jest.fn() };
    storageService = {
      getSaleReceiptPath: jest.fn().mockReturnValue('/storage/company-1/sale-1.pdf'),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    (fs.existsSync as jest.Mock).mockReturnValue(true);

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

  it('should throw NotFoundError when the receipt file is missing on disk', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale({ receiptPdfPath: 'r.pdf' }));
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(sut.execute({ saleId: 'sale-1' })).rejects.toThrow(NotFoundError);
  });

  it('should return the absolute path of the receipt', async () => {
    saleRepository.findByIdAndCompanyId.mockResolvedValue(makeSale({ receiptPdfPath: 'r.pdf' }));

    const output = await sut.execute({ saleId: 'sale-1' });

    expect(output).toEqual({ absolutePath: '/storage/company-1/sale-1.pdf' });
  });
});
