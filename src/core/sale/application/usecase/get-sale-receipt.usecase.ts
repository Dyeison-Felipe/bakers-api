import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { StorageService } from '@/shared/application/storage/storage.service';
import { SaleRepository } from '../../domain/repositories/sale.repository';

type Input = {
  saleId: string;
};

type Output = {
  buffer: Buffer;
};

export class GetSaleReceiptUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ saleId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const sale = await this.saleRepository.findByIdAndCompanyId(
      saleId,
      loggedUser.company.id,
    );

    if (!sale) {
      throw new NotFoundError('Venda não encontrada');
    }

    if (!sale.receiptPdfPath) {
      throw new NotFoundError('Esta venda não possui cupom gerado');
    }

    const buffer = await this.storageService.download(sale.receiptPdfPath);

    return { buffer };
  }
}
