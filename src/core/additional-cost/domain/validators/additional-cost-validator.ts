import { Company } from '@/core/company/domain/entities/company.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AdditionalCostProps } from '../entities/additional-cost.entity';

export class AdditionalCostRules {
  @MaxLength(255)
  @IsString()
  name: string;

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

  constructor(data: AdditionalCostProps) {
    Object.assign(this, data);
  }
}

export class AdditionalCostValidator extends ClassValidatorFields<AdditionalCostRules> {
  validate(data: AdditionalCostProps): boolean {
    return super.validate(new AdditionalCostRules(data ?? {}));
  }
}

export class AdditionalCostValidatorFactory {
  static create(): AdditionalCostValidator {
    // Retorna a instância do AddressValidator
    return new AdditionalCostValidator();
  }
}
