import {
  IsBoolean,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MONEY_MAX, PERCENT_MAX, QUANTITY_MAX, UNIT_COST_MAX } from '@/shared/domain/constants/field-limits';
import { Type } from 'class-transformer';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { CompanyRules } from '@/core/company/domain/validators/company-validator';
import { CategoryRules } from '@/core/category/domain/validators/category-validator';
import { ProductProps } from '../entities/product.entity';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
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
  scaleReference: string | null;

  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'Código de barras deve ter 13 dígitos numéricos (EAN13)',
  })
  @IsOptional()
  barCode: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^(\d{6}|\d{8})$/, {
    message: 'NCM deve ter 6 ou 8 dígitos numéricos',
  })
  ncm: string | null;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Max(MONEY_MAX)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @IsOptional()
  @Max(UNIT_COST_MAX)
  unitCostPrice: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Max(MONEY_MAX)
  pricePerKilogram: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Max(MONEY_MAX)
  salePrice: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Max(PERCENT_MAX)
  profitPrice: number | null;

  @IsEnum(TypeUnitOfMeasurement)
  @IsOptional()
  unitOfMeasurement: TypeUnitOfMeasurement | null;

  @IsEnum(TypeConsumptionUnit)
  @IsOptional()
  consumerUnit: TypeConsumptionUnit | null;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  expirationDateInDays: string | null;

  @IsBoolean()
  @IsNotEmpty()
  stockManagement: boolean;

  @IsEnum(TypeProduct)
  @IsNotEmpty()
  typeProduct: TypeProduct;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  currentStock: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  stockMin: number | null;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string | null;

  @IsEnum(TypeUnitOfPurchase)
  @IsOptional()
  purchaseUnit: TypeUnitOfPurchase | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  quantity: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  weight: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagePath: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  volume: number | null;

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
