import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { FindAllProductOutput } from '@/shared/application/output/product/find-all-product.output';
import { Product } from '../../domain/entities/product.entity';

type Input = {
  categoryId?: string;
};

type Output = FindAllProductOutput[];

export class FindAllProductByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ categoryId }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const products =
      await this.productRepository.findAllProductsByCompanyIdAndFilterCategoryId(
        loggedUser.company.id,
        categoryId,
      );

    return this.mapToOutput(products);
  }

  private mapToOutput(products: Product[]): Output {
    return products.map((product) => ({
      name: product.name,
      scaleReference: product.scaleReference,
      barCode: product.barCode,
      ncm: product.ncm,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      profitPrice: product.profitPrice,
      unitOfMeasurement: product.unitOfMeasurement,
      expirationDateInDays: product.expirationDateInDays,
      stockManagement: product.stockManagement,
      resale: product.resale,
      rowMaterial: product.rowMaterial,
      ownProduction: product.ownProduction,
      rowMaterialResale: product.rowMaterialResale,
      stockAtual: product.stockAtual,
      stockMin: product.stockMin,
      active: product.active,
      description: product.description,
      category: {
        id: product.category!.id,
        name: product.category!.name,
        parentId: product.category!.parent?.id ?? null,
        children: [],
      },
    }));
  }
}
