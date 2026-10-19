import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MONEY_MAX, PLAN_DURATION_MAX_DAYS, PLAN_USER_LIMIT_MAX } from '@/shared/domain/constants/field-limits';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { PlanProps } from '../entities/plan.entity';

export class PlanRules {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(MONEY_MAX)
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Max(PLAN_DURATION_MAX_DAYS)
  duration: number;

  // null = plano sem limite de usuários (ilimitado)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(PLAN_USER_LIMIT_MAX)
  userLimit: number | null;

  // null = plano gratuito, sem Product/Price correspondente no Stripe
  @IsOptional()
  @IsString()
  stripeProductId: string | null;

  @IsOptional()
  @IsString()
  stripePriceId: string | null;

  constructor(data: PlanProps) {
    Object.assign(this, data);
  }
}

export class PlanValidator extends ClassValidatorFields<PlanRules> {
  validate(data: PlanProps): boolean {
    return super.validate(new PlanRules(data ?? {}));
  }
}

export class PlanValidatorFactory {
  static create(): PlanValidator {
    // Retorna a instância do PlanValidator
    return new PlanValidator();
  }
}
