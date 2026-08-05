import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { LowStockProductOutput } from '@/shared/application/output/product/low-stock-product.output';
import { ProductRepository } from '../../domain/repositories/product.repository';

type Input = void;
type Output = LowStockProductOutput[];

export class FindLowStockProductsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const products = await this.productRepository.findLowStockByCompanyId(
      loggedUser.company.id,
    );

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      currentStock: product.currentStock,
      stockMin: product.stockMin,
      unitOfMeasurement: product.unitOfMeasurement,
    }));
  }
}
