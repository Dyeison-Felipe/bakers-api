import { Injectable } from '@nestjs/common';
import { ProductSchema } from '../../schema/product.schema';
import { Product } from '@/core/product/domain/entities/product.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { CategoryMapper } from '@/core/category/infra/database/typeorm/repositories/category-mapper';

@Injectable()
export class ProductMapper {
  static toEntity(schema: ProductSchema): Product {
    return new Product({
      id: schema.id,
      scaleReference: schema.scaleReference,
      name: schema.name,
      barCode: schema.barCode,
      ncm: schema.ncm,
      costPrice: schema.costPrice,
      unitCostPrice: schema.unitCostPrice,
      pricePerKilogram: schema.pricePerKilogram,
      salePrice: schema.salePrice,
      profitPrice: schema.profitPrice,
      unitOfMeasurement: schema.unitOfMeasurement,
      consumerUnit: schema.consumerUnit,
      expirationDateInDays: schema.expirationDateInDays,
      stockManagement: schema.stockManagement,
      typeProduct: schema.typeProduct,
      currentStock: schema.currentStock,
      stockMin: schema.stockMin,
      active: schema.active,
      description: schema.description,
      purchaseUnit: schema.purchaseUnit,
      quantity: schema.quantity,
      imagePath: schema.imagePath,
      weight: schema.weight,
      volume: schema.volume,
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      category: schema.category
        ? CategoryMapper.toEntity(schema.category)
        : null,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: Product): ProductSchema {
    return ProductSchema.with({
      id: entity.id,
      scaleReference: entity.scaleReference,
      name: entity.name,
      barCode: entity.barCode,
      ncm: entity.ncm,
      costPrice: entity.costPrice,
      unitCostPrice: entity.unitCostPrice,
      pricePerKilogram: entity.pricePerKilogram,
      salePrice: entity.salePrice,
      profitPrice: entity.profitPrice,
      unitOfMeasurement: entity.unitOfMeasurement,
      consumerUnit: entity.consumerUnit,
      expirationDateInDays: entity.expirationDateInDays,
      stockManagement: entity.stockManagement,
      typeProduct: entity.typeProduct,
      currentStock: entity.currentStock,
      stockMin: entity.stockMin,
      active: entity.active,
      description: entity.description,
      purchaseUnit: entity.purchaseUnit,
      quantity: entity.quantity,
      weight: entity.weight,
      volume: entity.volume,
      imagePath: entity.imagePath,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      company: CompanyRepositoryMapper.toSchema(entity.company!),
      category: CategoryMapper.toSchema(entity.category!),
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }

  static toUpdateSchema(entity: Product): ProductSchema {
    return ProductSchema.with({
      id: entity.id,
      scaleReference: entity.scaleReference,
      name: entity.name,
      barCode: entity.barCode,
      ncm: entity.ncm,
      costPrice: entity.costPrice,
      unitCostPrice: entity.unitCostPrice,
      pricePerKilogram: entity.pricePerKilogram,
      imagePath: entity.imagePath,
      salePrice: entity.salePrice,
      profitPrice: entity.profitPrice,
      unitOfMeasurement: entity.unitOfMeasurement,
      consumerUnit: entity.consumerUnit,
      expirationDateInDays: entity.expirationDateInDays,
      stockManagement: entity.stockManagement,
      typeProduct: entity.typeProduct,
      currentStock: entity.currentStock,
      stockMin: entity.stockMin,
      active: entity.active,
      description: entity.description,
      purchaseUnit: entity.purchaseUnit,
      quantity: entity.quantity,
      weight: entity.weight,
      volume: entity.volume,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      company: CompanyRepositoryMapper.toReference(entity.company!.id),
      category: CategoryMapper.toReference(entity.category!.id),
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
