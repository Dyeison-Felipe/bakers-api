import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { RecipeValidatorFactory } from '../validators/recipe-validator';

export type RecipeProps = {
  name: string;
  company: Company | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

export type CreateRecipeProps = {
  name: string;
  company: Company | null;
  createdBy: string;
  updatedBy: string;
};

export interface Recipe extends RecipeProps {}

@Data()
export class Recipe extends BaseEntity<RecipeProps> {
  protected validate(): void {
    const validator = RecipeValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateRecipeProps): Recipe {
    return new Recipe({
      id: crypto.randomUUID(),
      name: props.name,
      company: props.company,
      createdBy: props.createdBy,
      updatedBy: props.updatedBy,
    });
  }

  updateName(name: string, updatedBy: string): void {
    this.name = name;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }
}
