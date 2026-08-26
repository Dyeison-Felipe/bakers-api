import { GetProductImageUseCase } from '../usecase/get-image.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeLoggedUser, makeProduct } from './fixtures';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { StorageService } from '@/shared/application/storage/storage.service';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('GetProductImageUseCase', () => {
  let productRepository: jest.Mocked<Pick<ProductRepository, 'findById'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'download'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: GetProductImageUseCase;

  beforeEach(() => {
    productRepository = { findById: jest.fn() };
    storageService = {
      download: jest.fn().mockResolvedValue(Buffer.from('image-bytes')),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

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

  it('should throw NotFoundError when the product belongs to another company', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ imagePath: 'company/company-2/product/product-1.png', company: { id: 'company-2' } }),
    );

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the product has no image', async () => {
    productRepository.findById.mockResolvedValue(makeProduct({ imagePath: null }));

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the storage download fails', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ imagePath: 'company/company-1/product/product-1.png' }),
    );
    storageService.download.mockRejectedValue(new Error('not found in storage'));

    await expect(sut.execute({ productId: 'product-1' })).rejects.toThrow();
  });

  it('should return the file buffer and mimetype for a png image', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ imagePath: 'company/company-1/product/product-1.png' }),
    );

    const output = await sut.execute({ productId: 'product-1' });

    expect(storageService.download).toHaveBeenCalledWith(
      'company/company-1/product/product-1.png',
    );
    expect(output).toEqual({
      buffer: Buffer.from('image-bytes'),
      mimetype: 'image/png',
    });
  });

  it('should default to image/jpeg for an unknown extension', async () => {
    productRepository.findById.mockResolvedValue(
      makeProduct({ imagePath: 'company/company-1/product/product-1.bin' }),
    );

    const output = await sut.execute({ productId: 'product-1' });

    expect(output.mimetype).toBe('image/jpeg');
  });
});
