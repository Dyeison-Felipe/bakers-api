// get-product-image.usecase.ts
import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { StorageService } from '@/shared/application/storage/storage.service';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

type Input = {
  productId: string;
};

type Output = {
  buffer: Buffer;
  mimetype: string;
};

export class GetProductImageUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE) private readonly loggedUserService: LoggedUserService
  ) {}

  async execute({ productId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser()
    const product = await this.productRepository.findById(productId);

    if (!product || product.company?.id !== loggedUser.company?.id) {
      throw new NotFoundError('Produto não encontrado');
    }

    if (!product.imagePath) {
      throw new NotFoundError('Produto não possui imagem');
    }

    const buffer = await this.storageService.download(product.imagePath);
    const mimetype = this.getMimeType(product.imagePath);

    return { buffer, mimetype };
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }
}
