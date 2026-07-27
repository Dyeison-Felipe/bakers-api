import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeConsumptionUnit,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';

type Input = {
  id: string;
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
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
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
      input.category,
      loggedUser.company.id,
    );

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Só troca a imagem se uma nova foi enviada. Sem imagem nova,
    // mantém a referência atual (product.imagePath) intacta.
    let imagePath = product.imagePath;

    if (input.image?.buffer) {
      if (product.imagePath) {
        this.storageService.deleteProductImage(
          loggedUser.company.id,
          product.imagePath,
        );
      }
      imagePath = this.storageService.saveProductImage(
        loggedUser.company.id,
        input.image,
      );
    }

    product.update({
      name: input.name,
      scaleReference: input.scaleReference ?? null,
      barCode: input.barCode ?? product.barCode,
      ncm: input.ncm,
      costPrice: input.costPrice,
      salePrice: input.salePrice ?? product.salePrice,
      profitPrice: input.profitPrice ?? product.profitPrice,
      unitOfMeasurement: input.unitOfMeasurement ?? product.unitOfMeasurement,
      consumerUnit: input.consumerUnit ?? product.consumerUnit,
      expirationDateInDays:
        input.expirationDateInDays ?? product.expirationDateInDays,
      stockManagement: input.stockManagement,
      resale: input.resale,
      rowMaterial: input.rowMaterial,
      ownProduction: input.ownProduction,
      rowMaterialResale: input.rowMaterialResale,
      imagePath,
      stockAtual: input.currentStock ?? product.currentStock,
      stockMin: input.stockMin ?? product.stockMin,
      active: input.active,
      description: input.description ?? product.description,
      purchaseUnit: input.purchaseUnit ?? product.purchaseUnit,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      updatedBy: loggedUser.id,
      category,
    });

    await this.productRepository.update(product);

    return { id: product.id };
  }
}