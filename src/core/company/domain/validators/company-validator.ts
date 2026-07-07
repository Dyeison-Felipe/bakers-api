import {
  IsBoolean,
  IsEmail,
  IsInstance,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CompanyProps } from '../entities/company.entity';
import { AddressRules } from '@/core/address/domain/validators/address-validator';
import { Type } from 'class-transformer';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { PlanRules } from '@/core/plan/domain/validators/plan-validate';
import { Address } from '@/core/address/domain/entities/address.entity';
import { Plan } from '@/core/plan/domain/entities/plan.entity';

export class CompanyRules {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  fantasyName: string;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  socialReazon: string;

  @IsString()
  @MaxLength(14)
  @IsNotEmpty()
  cnpj: string;

  @IsEmail()
  @MaxLength(255)
  @IsNotEmpty()
  email: string;

  @IsString()
  @MaxLength(13)
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MaxLength(14)
  @IsNotEmpty()
  stateRegistration: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsOptional()
  @IsInstance(Address)
  address: AddressRules;

  @IsOptional()
  @IsInstance(Plan)
  plan: PlanRules;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: CompanyProps) {
    Object.assign(this, data);
  }
}

export class CompanyValidator extends ClassValidatorFields<CompanyRules> {
  validate(data: CompanyProps): boolean {
    return super.validate(new CompanyRules(data ?? {}));
  }
}

export class CompanyValidatorFactory {
  static create(): CompanyValidator {
    // Retorna a instância do CompanyValidator
    return new CompanyValidator();
  }
}
