import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeConsumptionUnit,
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
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { getSaleBasisCost } from '@/shared/application/utils/pricing.util';

type Input = {
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  salePrice?: number;
  profitPrice?: number;
  unitOfMeasurement?: TypeUnitOfMeasurement;
  consumerUnit?: TypeConsumptionUnit;
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
  image?: MulterFile;
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
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
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

    const imagePath = input.image?.buffer
      ? this.storageService.saveProductImage(company.id, input.image)
      : null;

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
      consumerUnit: input.consumerUnit ?? null,
      purchaseUnit: input.purchaseUnit ?? null,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      imagePath,
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

    if ((input.rowMaterial || input.rowMaterialResale) && !input.consumerUnit) {
      errors.consumerUnit = [
        'Unidade de consumo é obrigatória para matéria-prima',
      ];
    }

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

    const requiresSalePricingCheck =
      input.resale || input.ownProduction || input.rowMaterialResale;

    if (
      requiresSalePricingCheck &&
      (!input.salePrice === undefined || input.salePrice === null)
    ) {
      errors.salePrice = [
        'Preço de venda é obrigatório para produtos de revenda, produção própria ou matéria-prima de revenda',
      ];
    }

    const requirePrchasePricingCheck =
      input.rowMaterial || input.resale || input.rowMaterialResale;

    if (
      requirePrchasePricingCheck &&
      (input.costPrice === undefined || input.costPrice === null)
    ) {
      errors.costPrice = [
        'Preço de compra é obrigatório para produtos de revenda, matéria-prima ou matéria-prima de revenda',
      ];
    }

    const requiredConsumerUnitCheck =
      input.rowMaterial || input.rowMaterialResale;

    if (
      requiredConsumerUnitCheck &&
      (input.consumerUnit === undefined || input.consumerUnit === null)
    ) {
      errors.consumerUnit = [
        'Unidade de consumo é obrigatória para produtos matéria-prima ou matéria-prima de revenda',
      ];
    }

    const requiresVolumeCheck =
      input.rowMaterial || input.resale || input.rowMaterialResale;

    if (
      requiresVolumeCheck &&
      input.purchaseUnit === TypeUnitOfPurchase.ML &&
      !input.volume
    ) {
      errors.consumerUnit = [
        'O volume do produto é obrigatório para unidade de compra em Mililitro',
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

    const basis = getSaleBasisCost({
      purchaseUnit: input.purchaseUnit ?? null,
      unitOfMeasurement: input.unitOfMeasurement ?? null,
      costPrice: input.costPrice,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
    });

    const profitPrice = ((input.salePrice - basis) / basis) * 100;

    return Number(profitPrice.toFixed(2));
  }
}
