import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { CompanySubscriptionProps } from '../entities/company-subscription.entity';

export class CompanySubscriptionRules {
  @IsNotEmpty()
  company: unknown;

  @IsNotEmpty()
  plan: unknown;

  @IsString()
  @IsNotEmpty()
  mercadoPagoSubscriptionId: string;

  @IsIn(['pending', 'active', 'cancelled', 'rejected'])
  status: string;

  @IsEmail()
  @IsNotEmpty()
  payerEmail: string;

  @IsOptional()
  @IsString()
  cardLastFourDigits?: string | null;

  @IsOptional()
  @IsString()
  cardBrand?: string | null;

  constructor(data: CompanySubscriptionProps) {
    Object.assign(this, data);
  }
}

export class CompanySubscriptionValidator extends ClassValidatorFields<CompanySubscriptionRules> {
  validate(data: CompanySubscriptionProps): boolean {
    return super.validate(new CompanySubscriptionRules(data ?? ({} as CompanySubscriptionProps)));
  }
}

export class CompanySubscriptionValidatorFactory {
  static create(): CompanySubscriptionValidator {
    return new CompanySubscriptionValidator();
  }
}
