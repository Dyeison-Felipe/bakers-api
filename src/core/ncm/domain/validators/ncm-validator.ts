import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NcmProps } from '../entities/ncm.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';

export class NcmRules {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  constructor(data: NcmProps) {
    Object.assign(this, data);
  }
}

export class NcmValidator extends ClassValidatorFields<NcmRules> {
  validate(data: NcmProps): boolean {
    return super.validate(new NcmRules(data ?? {}));
  }
}

export class NcmValidatorFactory {
  static create(): NcmValidator {
    // Retorna a instância do CompanyValidator
    return new NcmValidator();
  }
}
