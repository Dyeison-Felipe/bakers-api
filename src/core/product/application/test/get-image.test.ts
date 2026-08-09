import * as fs from 'fs';
import { GetProductImageUseCase } from '../usecase/get-image.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

jest.mock('fs');

describe('GetProductImageUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findById'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'getProductImagePath'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: GetProductImageUseCase;

  beforeEach(() => {
    productRepository = { findById: jest.fn() };
    storageService = {
      getProductImagePath: jest.fn().mockReturnValue('/storage/company-1/product-1.png'),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    sut = new GetProductImageUseCase(
      productRepository as unknown as ProductRepository,
      storageService as unknown as StorageService,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the product has no image', async () => {
    productRepository.findById.mockResolvedValue(makeProduct({ imagePath: null }));

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the image file is missing on disk', async () => {
    productRepository.findById.mockResolvedValue(makeProduct({ imagePath: 'product-1.png' }));
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should return the absolute path and mimetype for a png image', async () => {
    productRepository.findById.mockResolvedValue(makeProduct({ imagePath: 'product-1.png' }));

    const output = await sut.execute({ productId: 'product-1' });

    expect(output).toEqual({
      absolutePath: '/storage/company-1/product-1.png',
      mimetype: 'image/png',
    });
  });

  it('should default to image/jpeg for an unknown extension', async () => {
    productRepository.findById.mockResolvedValue(makeProduct({ imagePath: 'product-1.bin' }));

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.mimetype).toBe('image/jpeg');
  });
});
