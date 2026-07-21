import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

type Input = {
  id: string;
  name: string;
  scaleReference?: string;
  barCode: string;
  ncm: string;
  costPrice: number;
  salePrice: number;
  profitPrice: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  expirationDateInDays: string;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  stockMin: number;
  active: boolean;
  description: string;
  categoryId: string;
};

type Output = {
  id: string;
};

export class UpdateProductUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      input.categoryId,
      loggedUser.company.id,
    );

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    product.update({
      name: input.name,
      scaleReference: input.scaleReference ?? null,
      barCode: input.barCode,
      ncm: input.ncm,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      profitPrice: input.profitPrice,
      unitOfMeasurement: input.unitOfMeasurement,
      expirationDateInDays: input.expirationDateInDays,
      stockManagement: input.stockManagement,
      resale: input.resale,
      rowMaterial: input.rowMaterial,
      ownProduction: input.ownProduction,
      rowMaterialResale: input.rowMaterialResale,
      stockAtual: product.currentStock,
      stockMin: input.stockMin,
      active: input.active,
      description: input.description,
      updatedBy: loggedUser.id,
      category,
    });

    await this.productRepository.update(product);

    const output: Output = {
      id: product.id,
    };

    return output;
  }
}
