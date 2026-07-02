import { Company } from '@/core/company/domain/entities/company.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { CategoryValidatorFactory } from '../validators/category-validator';

export type CategoryParentRef = {
  id: string;
  name: string;
};

export type CategoryProps = {
  name: string;
  company: Company;
  parent?: CategoryParentRef | null;
  children?: Category[];
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateCategoryProps = {
  name: string;
  company: Company;
  parent: CategoryParentRef | null;
  createdBy: string;
  updatedBy: string;
};

type UpdateCategoryProps = {
  name: string;
  parent: CategoryParentRef | null;
  updatedBy: string;
};

export interface Category extends CategoryProps {}

@Data()
export class Category extends BaseEntity<CategoryProps> {
  static create(props: CreateCategoryProps): Category {
    return new Category({
      id: crypto.randomUUID(),
      name: props.name,
      company: props?.company,
      parent: props.parent ?? null,
      children: [],
      createdBy: props.createdBy,
      updatedBy: props.updatedBy,
      deletedBy: null,
    });
  }

  update(props: UpdateCategoryProps): void {
    this.name = props.name;
    this.parent = props.parent ?? null;
    this.updatedBy = props.updatedBy;
    this.updateTimestamp();
  }

  protected validate(): void {
    const validator = CategoryValidatorFactory.create();
    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
