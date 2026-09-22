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
  ifNoneMatch?: string | null;
};

type Output = {
  buffer: Buffer | null;
  mimetype: string;
  etag: string;
  notModified: boolean;
};

export class GetProductImageUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE) private readonly loggedUserService: LoggedUserService
  ) {}

  async execute({ productId, ifNoneMatch = null }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser()
    const product = await this.productRepository.findById(productId);

    if (!product || product.company?.id !== loggedUser.company?.id) {
      throw new NotFoundError('Produto não encontrado');
    }

    if (!product.imagePath) {
      throw new NotFoundError('Produto não possui imagem');
    }

    const mimetype = this.getMimeType(product.imagePath);

    // A chave da imagem é única por upload (timestamp + random), então ela
    // identifica o conteúdo. O tenant já foi validado acima — só depois disso
    // é seguro responder 304 sem baixar nada do Storage.
    const etag = `"${product.imagePath}"`;

    if (ifNoneMatch === etag) {
      return { buffer: null, mimetype, etag, notModified: true };
    }

    const buffer = await this.storageService.download(product.imagePath);

    return { buffer, mimetype, etag, notModified: false };
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
