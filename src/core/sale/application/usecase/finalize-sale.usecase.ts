import { Inject } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { StorageService } from '@/shared/application/storage/storage.service';
import { FinalizeSaleOutput } from '@/shared/application/output/sale/finalize-sale.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { Product } from '@/core/product/domain/entities/product.entity';
import { WriteOffBatchUseCase } from '@/core/batch/application/usecase/write-off-batch.usecase';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { SaleRepository } from '../../domain/repositories/sale.repository';
import { SaleItemRepository } from '../../domain/repositories/sale-item.repository';
import { Sale } from '../../domain/entities/sale.entity';
import { SaleItem } from '../../domain/entities/sale-item.entity';
import { SaleReceiptPdfService } from '../services/sale-receipt-pdf.service';

type SaleItemInput = {
  productId: string;
  quantity?: number;
  weightInKg?: number;
};

type Input = {
  items: SaleItemInput[];
  paymentMethod: TypePaymentMethod;
  amountReceived?: number;
  customerCpf?: string;
};

type Output = FinalizeSaleOutput;

type PreparedItem = {
  product: Product;
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantity: number | null;
  weightInKg: number | null;
  quantityForStock: number;
  unitPrice: number;
  subtotal: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FinalizeSaleUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly writeOffBatchUseCase: WriteOffBatchUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Informe ao menos um item para a venda');
    }

    const session = await this.cashRegisterSessionRepository.findOpenByCompanyId(
      company.id,
    );

    if (!session || session.status !== TypeCashRegisterSessionStatus.OPEN) {
      throw new BadRequestError(
        'Nenhum caixa aberto. Abra o caixa antes de vender.',
      );
    }

    const preparedItems: PreparedItem[] = [];

    for (const item of input.items) {
      const product = await this.productRepository.findProductByIdAndCompanyId(
        item.productId,
        company.id,
      );

      if (!product) {
        throw new NotFoundError('Produto não encontrado');
      }

      if (!product.active) {
        throw new BadRequestError(`Produto "${product.name}" está inativo`);
      }

      if (product.salePrice == null) {
        throw new BadRequestError(
          `Produto "${product.name}" não possui preço de venda configurado`,
        );
      }

      const isWeightBased =
        product.unitOfMeasurement === TypeUnitOfMeasurement.KG;
      const quantityForStock = isWeightBased
        ? item.weightInKg
        : item.quantity;

      if (!quantityForStock || quantityForStock <= 0) {
        throw new BadRequestError(
          `Informe a ${isWeightBased ? 'peso' : 'quantidade'} do produto "${product.name}"`,
        );
      }

      const subtotal = round2(product.salePrice * quantityForStock);

      preparedItems.push({
        product,
        unitOfMeasurement:
          product.unitOfMeasurement ?? TypeUnitOfMeasurement.UN,
        quantity: isWeightBased ? null : quantityForStock,
        weightInKg: isWeightBased ? quantityForStock : null,
        quantityForStock,
        unitPrice: product.salePrice,
        subtotal,
      });
    }

    const totalAmount = round2(
      preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
    );

    let amountReceived: number | null = null;
    let changeAmount: number | null = null;

    if (input.paymentMethod === TypePaymentMethod.CASH) {
      if (input.amountReceived == null) {
        throw new BadRequestError(
          'Informe o valor recebido do cliente em dinheiro',
        );
      }

      if (input.amountReceived < totalAmount) {
        throw new BadRequestError('Valor recebido insuficiente');
      }

      amountReceived = input.amountReceived;
      changeAmount = round2(input.amountReceived - totalAmount);
    }

    for (const item of preparedItems) {
      if (!item.product.stockManagement) continue;

      await this.writeOffBatchUseCase.execute({
        productId: item.product.id,
        quantity: item.quantityForStock,
        reason: TypeBatchMovementReason.SALE,
      });
    }

    const customerCpf =
      input.customerCpf && input.customerCpf.length === 11
        ? input.customerCpf
        : null;

    const sale = Sale.create({
      company,
      cashRegisterSession: session,
      paymentMethod: input.paymentMethod,
      totalAmount,
      amountReceived,
      changeAmount,
      customerCpf,
      soldBy: loggedUser.id,
    });

    const savedSale = await this.saleRepository.save(sale);

    const saleItems = preparedItems.map((item) =>
      SaleItem.create({
        sale: savedSale,
        product: item.product,
        productNameSnapshot: item.product.name,
        unitOfMeasurement: item.unitOfMeasurement,
        quantity: item.quantity,
        weightInKg: item.weightInKg,
        unitPriceSnapshot: item.unitPrice,
        subtotal: item.subtotal,
        createdBy: loggedUser.id,
      }),
    );

    await this.saleItemRepository.saveMany(saleItems);

    let receiptPdfUrl: string | undefined;

    if (customerCpf) {
      const buffer = await SaleReceiptPdfService.generate({
        company: {
          fantasyName: company.fantasyName,
          cnpj: company.cnpj,
          address: company.address
            ? `${company.address.street}, ${company.address.number} - ${company.address.neighborhood}`
            : null,
        },
        sale: {
          id: savedSale.id,
          createdAt: savedSale.auditable?.createdAt ?? new Date(),
          paymentMethod: savedSale.paymentMethod,
          totalAmount: savedSale.totalAmount,
          amountReceived: savedSale.amountReceived,
          changeAmount: savedSale.changeAmount,
          customerCpf: savedSale.customerCpf,
        },
        items: saleItems.map((item) => ({
          name: item.productNameSnapshot,
          quantity: item.quantity,
          weightInKg: item.weightInKg,
          unitPrice: item.unitPriceSnapshot,
          subtotal: item.subtotal,
        })),
      });

      const filename = this.storageService.saveSaleReceipt(
        company.id,
        savedSale.id,
        buffer,
      );

      savedSale.attachReceipt(filename, loggedUser.id);
      await this.saleRepository.update(savedSale);
      receiptPdfUrl = `/v1/sale/${savedSale.id}/receipt`;
    }

    return {
      id: savedSale.id,
      totalAmount,
      amountReceived,
      changeAmount,
      receiptPdfUrl,
    };
  }
}
