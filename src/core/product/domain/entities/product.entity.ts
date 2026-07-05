import { Category } from '@/core/category/domain/entities/category.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { ProductValidatorFactory } from '../validator/product-validator';
import { EntityValidationError } from '@/shared/application/errors/validation-error';

export type ProductProps = {
  name: string;
  scaleReference: string | null;
  barCode: string | null;
  ncm: string;
  costPrice: number;
  salePrice: number;
  profitPrice: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  expirationDateInDays: string | null;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  stockAtual: number | null;
  stockMin: number | null;
  active: boolean;
  description: string | null;
  createdBy: string;
  updatedBy: string;
  deletedBy: string | null;
  company?: Company | null;
  category?: Category | null;
};

type CreateProductProps = {
  name: string;
  scaleReference: string | null;
  barCode: string | null;
  ncm: string;
  costPrice: number;
  salePrice: number;
  profitPrice: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  expirationDateInDays: string | null;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  stockAtual: number | null;
  stockMin: number | null;
  active: boolean;
  description: string | null;
  createdBy: string;
  updatedBy: string;
  company: Company | null;
  category: Category | null;
};

type UpdateProductProps = {
  name: string;
  scaleReference: string | null;
  barCode: string | null;
  ncm: string;
  costPrice: number;
  salePrice: number;
  profitPrice: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  expirationDateInDays: string | null;
  stockManagement: boolean;
  resale: boolean;
  rowMaterial: boolean;
  ownProduction: boolean;
  rowMaterialResale: boolean;
  stockAtual: number | null;
  stockMin: number | null;
  active: boolean;
  description: string | null;
  updatedBy: string;
  category: Category | null;
};

export interface Product extends ProductProps {}

@Data()
export class Product extends BaseEntity<ProductProps> {
  protected validate(): void {
    const validator = ProductValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateProductProps): Product {
    return new Product({
      id: crypto.randomUUID(),
      scaleReference: props.scaleReference,
      name: props.name,
      barCode: props.barCode,
      ncm: props.ncm,
      costPrice: props.costPrice,
      salePrice: props.salePrice,
      profitPrice: props.profitPrice,
      unitOfMeasurement: props.unitOfMeasurement,
      expirationDateInDays: props.expirationDateInDays,
      stockManagement: props.stockManagement,
      resale: props.resale,
      rowMaterial: props.rowMaterial,
      ownProduction: props.ownProduction,
      rowMaterialResale: props.rowMaterialResale,
      stockAtual: props.stockAtual,
      stockMin: props.stockMin,
      active: props.active,
      description: props.description,
      createdBy: props.createdBy,
      updatedBy: props.updatedBy,
      deletedBy: null,
      company: props.company ?? null,
      category: props.category ?? null,
    });
  }

  update(props: UpdateProductProps): void {
    this.name = props.name;
    this.barCode = props.barCode;
    this.ncm = props.ncm;
    this.costPrice = props.costPrice;
    this.salePrice = props.salePrice;
    this.profitPrice = props.profitPrice;
    this.unitOfMeasurement = props.unitOfMeasurement;
    this.expirationDateInDays = props.expirationDateInDays;
    this.stockManagement = props.stockManagement;
    this.resale = props.resale;
    this.rowMaterial = props.rowMaterial;
    this.ownProduction = props.ownProduction;
    this.rowMaterialResale = props.rowMaterialResale;
    this.stockAtual = props.stockAtual;
    this.stockMin = props.stockMin;
    this.active = props.active;
    this.description = props.description;
    this.updatedBy = props.updatedBy;
    this.category = props.category ?? null;
    this.updateTimestamp();
  }
}
