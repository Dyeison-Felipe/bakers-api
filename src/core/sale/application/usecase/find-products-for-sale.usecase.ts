import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { ProductForSaleOutput } from '@/shared/application/output/sale/find-products-for-sale.output';

type Input = {
  search?: string;
  page?: number;
};

type Output = PaginationOutput<ProductForSaleOutput>;

export class FindProductsForSaleUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ search, page }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const products = await this.productRepository.findEligibleForSale(
      loggedUser.company.id,
      search,
      { page },
    );

    return {
      items: products.items.map((product) => ({
        id: product.id,
        name: product.name,
        barCode: product.barCode,
        unitOfMeasurement: product.unitOfMeasurement,
        salePrice: product.salePrice,
        currentStock: product.currentStock,
        stockManagement: product.stockManagement,
        imagePath: product.imagePath,
      })),
      meta: products.meta,
    };
  }
}
