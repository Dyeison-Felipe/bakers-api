import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UserProps } from '../entities/user.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Type } from 'class-transformer';
import { RoleRules } from '@/core/role/domain/validators/role-validators';
import { CompanyRules } from '@/core/company/domain/validators/company-validator';

export class UserRules {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  username: string;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;

  @MaxLength(255)
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsBoolean()
  @IsNotEmpty()
  emailVerified: boolean;

  @IsDate()
  @IsOptional()
  emailVerifiedAt?: Date | null;

  @IsString()
  @IsOptional()
  passwordResetCode?: string | null;

  @IsDate()
  @IsOptional()
  expiredAtCode?: Date | null;

  @Type(() => RoleRules)
  @IsNotEmpty()
  role: RoleRules;

  @Type(() => CompanyRules)
  @IsNotEmpty()
  company: CompanyRules;

  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  createdBy: string;

  @IsString()
  // @IsNotEmpty()
  @IsOptional()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: UserProps) {
    Object.assign(this, data);
  }
}

export class UserValidator extends ClassValidatorFields<UserRules> {
  validate(data: UserProps): boolean {
    return super.validate(new UserRules(data ?? {}));
  }
}

export class UserValidatorFactory {
  static create(): UserValidator {
    // Retorna a instância do UserValidator
    return new UserValidator();
  }
}
