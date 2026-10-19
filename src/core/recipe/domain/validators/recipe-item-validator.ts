import {
  IsInstance,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { QUANTITY_MAX } from '@/shared/domain/constants/field-limits';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Product } from '@/core/product/domain/entities/product.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeItemProps } from '../entities/recipe-item.entity';

export class RecipeItemRules {
  @IsOptional()
  @IsInstance(Recipe)
  recipe: Recipe;

  @IsOptional()
  @IsInstance(Product)
  material: Product;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  quantity: number | null;

  constructor(data: RecipeItemProps) {
    Object.assign(this, data);
  }
}

export class RecipeItemValidator extends ClassValidatorFields<RecipeItemRules> {
  validate(data: RecipeItemProps): boolean {
    return super.validate(new RecipeItemRules(data ?? {}));
  }
}

export class RecipeItemValidatorFactory {
  static create(): RecipeItemValidator {
    return new RecipeItemValidator();
  }
}
