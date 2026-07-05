import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { CreateProductOutput } from '@/shared/application/output/product/create-product.output';
import { NotFoundError } from '@/shared/application/errors/not-found-error';

type Input = {
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  salePrice: number;
  profitPrice: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  expirationDateInDays?: string;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  stockAtual?: number;
  stockMin?: number;
  active: boolean;
  description?: string;
  category: string;
};

type Output = CreateProductOutput;

export class CreateProductUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const company = loggedUser.company;

    const exisProduct =
      await this.productRepository.findProductByNameAndCompanyId(
        input.name,
        company.id,
      );

    if (exisProduct) {
      throw new ConflictError(`Produto ${input.name} já está cadastrado`);
    }

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      input.category,
      company.id,
    );

    if(!category) {
      throw new NotFoundError(`Categoria não encontrada`)
    }

    const newProduct = Product.create({
      name: input.name,
      active: input.active,
      barCode: input.barCode ?? null,
      costPrice: input.costPrice,
      description: input.description ?? null,
      expirationDateInDays: input.expirationDateInDays ?? null,
      ncm: input.ncm,
      ownProduction: input.ownProduction,
      profitPrice: input.profitPrice,
      resale: input.resale,
      rowMaterial: input.rowMaterial,
      rowMaterialResale: input.rowMaterialResale,
      salePrice: input.salePrice,
      scaleReference: input.scaleReference ?? null,
      stockAtual: input.stockAtual ?? null,
      stockMin: input.stockMin ?? null,
      stockManagement: input.stockManagement,
      unitOfMeasurement: input.unitOfMeasurement,
      createdBy: loggedUser.id,
      category: category,
      company: company,
      updatedBy: loggedUser.id,
    });

    const saveProduct = await this.productRepository.save(newProduct);

    const output: Output = {
      id: saveProduct.id,
    };

    return output;
  }
}
