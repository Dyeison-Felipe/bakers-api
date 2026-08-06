import { Company } from '@/core/company/domain/entities/company.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  IsInstance,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecipeProps } from '../entities/recipe.entity';

export class RecipeRules {
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

  constructor(data: RecipeProps) {
    Object.assign(this, data);
  }
}

export class RecipeValidator extends ClassValidatorFields<RecipeRules> {
  validate(data: RecipeProps): boolean {
    return super.validate(new RecipeRules(data ?? {}));
  }
}

export class RecipeValidatorFactory {
  static create(): RecipeValidator {
    return new RecipeValidator();
  }
}
