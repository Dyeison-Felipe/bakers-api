import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { FindAllProductOutput } from '@/shared/application/output/product/find-all-product.output';
import { Product } from '../../domain/entities/product.entity';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { ProductStatus, TypeProduct } from '@/shared/infra/enums/product';

type Input = {
  categoryId?: string;
  status?: ProductStatus;
  typeProduct?: TypeProduct
};

type Output = PaginationOutput<FindAllProductOutput>;

export class FindAllProductByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ categoryId, status, typeProduct }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const statusProduct = status === ProductStatus.INATIVO ? false : true;

    const products = await this.productRepository.findAllProductsByCompanyId(
      loggedUser.company.id,
      statusProduct,
      categoryId,
      typeProduct
    );

    const results: Output = {
      items: products.items.map((product) => ({
        id: product.id,
        name: product.name,
        scaleReference: product.scaleReference,
        barCode: product.barCode,
        ncm: product.ncm,
        costPrice: product.costPrice,
        unitCostPrice: product.unitCostPrice,
        pricePerKilogram: product.pricePerKilogram,
        salePrice: product.salePrice,
        profitPrice: product.profitPrice,
        unitOfMeasurement: product.unitOfMeasurement,
        consumerUnit: product.consumerUnit,
        expirationDateInDays: product.expirationDateInDays,
        stockManagement: product.stockManagement,
        typeProduct:product.typeProduct,
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
      })),
      meta: products.meta,
    };

    return results;
  }
}
