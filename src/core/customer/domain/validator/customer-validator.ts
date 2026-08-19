import {
  IsBoolean,
  IsEmail,
  IsInstance,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Address } from '@/core/address/domain/entities/address.entity';
import { CustomerProps } from '../entities/customer.entity';

export class CustomerRules {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @IsString()
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos numéricos' })
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @MaxLength(11)
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInstance(Address)
  @IsNotEmpty()
  address: Address;

  @IsOptional()
  @IsInstance(Company)
  company?: Company | null;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: CustomerProps) {
    Object.assign(this, data);
  }
}

export class CustomerValidator extends ClassValidatorFields<CustomerRules> {
  validate(data: CustomerProps): boolean {
    return super.validate(new CustomerRules(data ?? {}));
  }
}

export class CustomerValidatorFactory {
  static create(): CustomerValidator {
    return new CustomerValidator();
  }
}
