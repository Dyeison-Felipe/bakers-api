import {
  IsBoolean,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { CompanyRules } from '@/core/company/domain/validators/company-validator';
import { CategoryRules } from '@/core/category/domain/validators/category-validator';
import { ProductProps } from '../entities/product.entity';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { Category } from '@/core/category/domain/entities/category.entity';
import { Company } from '@/core/company/domain/entities/company.entity';

export class ProductRules {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  scaleReference: string | null

  @IsString()
  @MaxLength(14)
  @IsOptional()
  barCode: string | null;

  @IsString()
  @MaxLength(8)
  @IsNotEmpty()
  ncm: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  costPrice: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  salePrice: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  profitPrice: number;

  @IsEnum(TypeUnitOfMeasurement)
  @IsNotEmpty()
  unitOfMeasurement: TypeUnitOfMeasurement;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  expirationDateInDays: string | null;

  @IsBoolean()
  @IsNotEmpty()
  stockManagement: boolean;

  @IsBoolean()
  @IsNotEmpty()
  resale: boolean;

  @IsBoolean()
  @IsNotEmpty()
  rowMaterial: boolean;

  @IsBoolean()
  @IsNotEmpty()
  ownProduction: boolean;

  @IsBoolean()
  @IsNotEmpty()
  rowMaterialResale: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockAtual: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMin: number | null;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  @IsOptional()
  @IsInstance(Company)
  company?: Company | null;

  @IsOptional()
  @IsInstance(Category)
  category?: Category | null;

  constructor(data: ProductProps) {
    Object.assign(this, data);
  }
}

export class ProductValidator extends ClassValidatorFields<ProductRules> {
  validate(data: ProductProps): boolean {
    return super.validate(new ProductRules(data ?? {}));
  }
}

export class ProductValidatorFactory {
  static create(): ProductValidator {
    return new ProductValidator();
  }
}