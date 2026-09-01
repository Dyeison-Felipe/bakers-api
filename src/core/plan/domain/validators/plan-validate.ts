import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
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

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration: number;

  // null = plano sem limite de usuários (ilimitado)
  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit: number | null;

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
