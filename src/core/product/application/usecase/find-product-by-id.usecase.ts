import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { FindProductOutput } from '@/shared/application/output/product/product.output';

type Input = {
  productId: string;
};

type Output = FindProductOutput;

export class FindProductByIdAndCompanyId implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ productId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const product = await this.productRepository.findProductByIdAndCompanyId(
      productId,
      loggedUser.company.id,
    );

    if (!product) {
      throw new NotFoundError(`Produto não encontrado`);
    }

    const output: Output = {
      id: product.id,
      name: product.name,
      scaleReference: product.scaleReference,
      barCode: product.barCode,
      ncm: product.ncm,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      profitPrice: product.profitPrice,
      unitOfMeasurement: product.unitOfMeasurement,
      consumerUnit: product.consumerUnit,
      expirationDateInDays: product.expirationDateInDays,
      stockManagement: product.stockManagement,
      pricePerKilogram: product.pricePerKilogram,
      typeProduct: product.typeProduct,
      unitCostPrice: product.unitCostPrice,
      currentStock: product.currentStock,
      stockMin: product.stockMin,
      active: product.active,
      description: product.description,
      purchaseUnit: product.purchaseUnit,
      quantity: product.quantity,
      weight: product.weight,
      volume: product.volume,
      imagePath: product.imagePath,
      category: {
        id: product.category!.id,
        name: product.category!.name,
        parentId: product.category!.parent?.id ?? null,
        children: [],
      },
    };

    return output;
  }
}
