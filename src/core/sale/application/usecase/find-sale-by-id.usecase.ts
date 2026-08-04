import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { SaleOutput } from '@/shared/application/output/sale/sale.output';
import { SaleRepository } from '../../domain/repositories/sale.repository';
import { SaleItemRepository } from '../../domain/repositories/sale-item.repository';

type Input = {
  id: string;
};

type Output = SaleOutput;

export class FindSaleByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const sale = await this.saleRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!sale) {
      throw new NotFoundError('Venda não encontrada');
    }

    const items = await this.saleItemRepository.findAllBySaleId(sale.id);

    return {
      id: sale.id,
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      totalAmount: sale.totalAmount,
      amountReceived: sale.amountReceived,
      changeAmount: sale.changeAmount,
      customerCpf: sale.customerCpf,
      hasReceipt: !!sale.receiptPdfPath,
      soldBy: sale.soldBy,
      createdAt: sale.auditable?.createdAt ?? new Date(),
      items: items.map((item) => ({
        id: item.id,
        product: {
          id: item.product!.id,
          name: item.productNameSnapshot,
        },
        unitOfMeasurement: item.unitOfMeasurement,
        quantity: item.quantity,
        weightInKg: item.weightInKg,
        unitPriceSnapshot: item.unitPriceSnapshot,
        subtotal: item.subtotal,
      })),
    };
  }
}
