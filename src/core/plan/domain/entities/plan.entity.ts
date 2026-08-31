import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { PlanValidatorFactory } from '../validators/plan-validate';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Permission } from '@/core/permission/domain/entity/permission.entity';

export type PlanProps = {
  name: string;
  price: number;
  active: boolean;
  description: string;
  duration: number;
  permissions?: Permission[];
};

type CreatePlanProps = {
  name: string;
  price: number;
  description: string;
  duration: number;
};

type UpdatePlanProps = {
  name: string;
  price: number;
  active: boolean;
  description: string;
  duration: number;
};

export interface Plan extends PlanProps { }

@Data()
export class Plan extends BaseEntity<PlanProps> {
  static create(props: CreatePlanProps): Plan {
    return new Plan({
      id: crypto.randomUUID(),
      name: props.name,
      price: props.price,
      duration: props.duration,
      active: true,
      description: props.description,
    });
  }

  update(props: UpdatePlanProps): void {
    this.name = props.name;
    this.price = props.price;
    this.description = props.description;
    this.active = props.active;
  }

    deleted():void {
      this.active = false
      this.markAsDeleted()
    }

  protected validate() {
    const validator = PlanValidatorFactory.create();

    const isValid = validator.validate(this.props);

    if (!isValid) {
      console.log('Plan validate errors:', JSON.stringify(validator.errors))
      throw new EntityValidationError(validator.errors);
    }
  }
}
