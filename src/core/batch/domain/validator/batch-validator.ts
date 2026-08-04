import { Company } from '@/core/company/domain/entities/company.entity';
import { Product } from '@/core/product/domain/entities/product.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  IsDate,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BatchProps } from '../entities/batch.entity';

export class BatchRules {
  @IsOptional()
  @IsInstance(Product)
  product: Product | null;

  @IsOptional()
  @IsInstance(Company)
  company: Company | null;

  @IsOptional()
  @IsUUID()
  dailyProductionItemId: string | null;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  remainingQuantity: number;

  @IsEnum(TypeUnitOfMeasurement)
  unitOfMeasurement: TypeUnitOfMeasurement;

  @IsDate()
  productionDate: Date;

  @IsOptional()
  @IsDate()
  expirationDate: Date | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: BatchProps) {
    Object.assign(this, data);
  }
}

export class BatchValidator extends ClassValidatorFields<BatchRules> {
  validate(data: BatchProps): boolean {
    return super.validate(new BatchRules(data ?? {}));
  }
}

export class BatchValidatorFactory {
  static create(): BatchValidator {
    return new BatchValidator();
  }
}
