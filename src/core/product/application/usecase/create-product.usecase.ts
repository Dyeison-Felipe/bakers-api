import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { CreateProductOutput } from '@/shared/application/output/product/create-product.output';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
type Input = {
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  unitCostPrice: number;
  pricePerKilogram?: number;
  salePrice?: number;
  profitPrice?: number;
  unitOfMeasurement?: TypeUnitOfMeasurement;
  consumerUnit?: TypeConsumptionUnit;
  expirationDateInDays?: string;
  stockManagement: boolean;
  typeProduct: TypeProduct;
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

    // const businessErrors = this.validateBusinessRules(input);
    // if (Object.keys(businessErrors).length > 0) {
    //   throw new EntityValidationError(businessErrors);
    // }

    // const profitPrice = this.calculateProfitPrice(input);

    const imagePath = input.image?.buffer
      ? this.storageService.saveProductImage(company.id, input.image)
      : null;

    const newProduct = Product.create({
      name: input.name,
      active: input.active,
      barCode: input.barCode ?? null,
      costPrice: input.costPrice,
      unitCostPrice: input.unitCostPrice,
      pricePerKilogram: input.pricePerKilogram ?? null,
      description: input.description ?? null,
      expirationDateInDays: input.expirationDateInDays ?? null,
      ncm: input.ncm,
      typeProduct: input.typeProduct,
      profitPrice: input.profitPrice ?? 1,
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

  // private validateBusinessRules(input: Input): FieldsError {
  //   const errors: FieldsError = {};

  //   if (!input.typeProduct) {
  //     errors.typeProduct = ['O tipo de produto é obrigatório'];
  //   }

  //   if (!input.costPrice) {
  //     errors.costPrice = [
  //       'Preço de custo é obrigatória para produto do tipo matéria-prima',
  //     ];
  //   }

  //   if (!input.unitCostPrice) {
  //     errors.unitCostPrice = [
  //       'Preço de custo unitário é obrigatória para produto do tipo matéria-prima',
  //     ];
  //   }

  //   // TIPO DE PRODUTO
  //   const isRowMaterial = input.typeProduct === TypeProduct.RAW_MATERIAL;
  //   const isOwnProduction = input.typeProduct === TypeProduct.OWN_PRODUCTION;

  //   // UNIDADE DE CONSUMO
  //   const unitConsumerVolume = input.consumerUnit === TypeConsumptionUnit.ML;
  //   const unitConsumerWeight = input.consumerUnit === TypeConsumptionUnit.KG;
  //   const unitConsumerUnit = input.consumerUnit === TypeConsumptionUnit.UN;

  //   // UNIDADE DE VENDA
  //   const saleUnit = (input.unitOfMeasurement = TypeUnitOfMeasurement.UN);

  //   if (isRowMaterial) {
  //     if (!input.consumerUnit) {
  //       errors.consumerUnit = [
  //         'Unidade de consumo é obrigatória para produto do tipo matéria-prima',
  //       ];
  //     }

  //     if (!input.purchaseUnit) {
  //       errors.purchaseUnit = [
  //         'Unidade de compra é obrigatória para produto do tipo matéria-prima',
  //       ];
  //     }

  //     if (unitConsumerVolume && !input.volume) {
  //       errors.volume = [
  //         'O volume é obrigatório para unidade de consumo em ml',
  //       ];
  //     }

  //     if (unitConsumerWeight && !input.weight) {
  //       errors.weight = ['O peso é obrigatório para unidade de consumo em kg'];
  //     }
  //   }

  //   if (input.stockManagement) {
  //     if (input.currentStock === undefined || input.currentStock === null) {
  //       errors.currentStock = [
  //         'Quantidade atual em estoque é obrigatória quando o gerenciamento de estoque está ativado',
  //       ];
  //     }
  //     if (input.stockMin === undefined || input.stockMin === null) {
  //       errors.stockMin = [
  //         'Quantidade mínima em estoque é obrigatória quando o gerenciamento de estoque está ativado',
  //       ];
  //     }
  //   }

  //   return errors;
  // }

  // private calculateProfitPrice(input: Input): number | null {
  //   const requiresPricingCheck =
  //     input.typeProduct === TypeProduct.RESALE ||
  //     input.typeProduct === TypeProduct.OWN_PRODUCTION ||
  //     input.typeProduct === TypeProduct.RAW_MATERIAL_AND_RESALE;

  //   if (!requiresPricingCheck || input.salePrice == null) {
  //     return null;
  //   }

  //   const basis = getSaleBasisCost({
  //     purchaseUnit: input.purchaseUnit ?? null,
  //     unitOfMeasurement: input.unitOfMeasurement ?? null,
  //     costPrice: input.costPrice,
  //     quantity: input.quantity ?? null,
  //     weight: input.weight ?? null,
  //     volume: input.volume ?? null,
  //   });

  //   const profitPrice = ((input.salePrice - basis) / basis) * 100;

  //   return Number(profitPrice.toFixed(2));
  // }
}
