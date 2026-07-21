import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { CreateProductOutput } from '@/shared/application/output/product/create-product.output';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { FieldsError } from '@/shared/application/validators/validator-field.interface';
import { EntityValidationError } from '@/shared/application/errors/validation-error';

type Input = {
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  salePrice?: number;
  profitPrice?: number;
  unitOfMeasurement?: TypeUnitOfMeasurement;
  expirationDateInDays?: string;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  currentStock?: number;
  stockMin?: number;
  active: boolean;
  description?: string;
  purchaseUnit?: TypeUnitOfPurchase;
  quantity?: number;
  weight?: number;
  volume?: number;
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

    if (!category) {
      throw new NotFoundError(`Categoria não encontrada`);
    }

    const businessErrors = this.validateBusinessRules(input);
    if (Object.keys(businessErrors).length > 0) {
      throw new EntityValidationError(businessErrors);
    }

    const profitPrice = this.calculateProfitPrice(input);

    const newProduct = Product.create({
      name: input.name,
      active: input.active,
      barCode: input.barCode ?? null,
      costPrice: input.costPrice,
      description: input.description ?? null,
      expirationDateInDays: input.expirationDateInDays ?? null,
      ncm: input.ncm,
      ownProduction: input.ownProduction,
      profitPrice,
      resale: input.resale,
      rowMaterial: input.rowMaterial,
      rowMaterialResale: input.rowMaterialResale,
      salePrice: input.salePrice ?? null,
      scaleReference: input.scaleReference ?? null,
      stockAtual: input.currentStock ?? null,
      stockMin: input.stockMin ?? null,
      stockManagement: input.stockManagement,
      unitOfMeasurement: input.unitOfMeasurement ?? null,
      purchaseUnit: input.purchaseUnit ??null,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      createdBy: loggedUser.id,
      category: category,
      company: company,
      updatedBy: loggedUser.id,
    });

    const saveProduct = await this.productRepository.save(newProduct);

    return { id: saveProduct.id };
  }

  private validateBusinessRules(input: Input): FieldsError {
    const errors: FieldsError = {};

    const hasAnyProductType =
      input.resale ||
      input.ownProduction ||
      input.rowMaterialResale ||
      input.rowMaterial;

    if (!hasAnyProductType) {
      errors.resale = [
        'É necessário marcar ao menos um tipo de produto: revenda, produção própria, matéria-prima de revenda ou matéria-prima',
      ];
      return errors;
    }

    if (input.stockManagement) {
      if (input.currentStock === undefined || input.currentStock === null) {
        errors.currentStock = [
          'Quantidade atual em estoque é obrigatória quando o gerenciamento de estoque está ativado',
        ];
      }
      if (input.stockMin === undefined || input.stockMin === null) {
        errors.stockMin = [
          'Quantidade mínima em estoque é obrigatória quando o gerenciamento de estoque está ativado',
        ];
      }
    }

    const requiresPricingCheck =
      input.resale || input.ownProduction || input.rowMaterialResale;

    if (
      requiresPricingCheck &&
      (input.salePrice === undefined || input.salePrice === null)
    ) {
      errors.salePrice = [
        'Preço de venda é obrigatório para produtos de revenda, produção própria ou matéria-prima de revenda',
      ];
    }

    return errors;
  }

  private calculateProfitPrice(input: Input): number | null {
    const requiresPricingCheck =
      input.resale || input.ownProduction || input.rowMaterialResale;

    if (!requiresPricingCheck || input.salePrice == null) {
      return null;
    }

    const profitPrice =
      ((input.salePrice - input.costPrice) / input.costPrice) * 100;

    return Number(profitPrice.toFixed(2));
  }
}
