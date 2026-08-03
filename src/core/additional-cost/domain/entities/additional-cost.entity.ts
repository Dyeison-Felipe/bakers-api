import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { AdditionalCostValidatorFactory } from '../validators/additional-cost-validator';

export type AdditionalCostProps = {
  name: string;
  company: Company | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

export type CreateAdditionalCostProps = {
  name: string;
  company: Company | null;
  createdBy: string;
  updatedBy: string;
};

export interface AdditionalCost extends AdditionalCostProps {}

@Data()
export class AdditionalCost extends BaseEntity<AdditionalCostProps> {
  protected validate(): void {
    const validator = AdditionalCostValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateAdditionalCostProps): AdditionalCost {
    return new AdditionalCost({
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
