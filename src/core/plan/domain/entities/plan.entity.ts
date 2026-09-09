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
  features: string[];
  duration: number;
  userLimit: number | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  permissions?: Permission[];
};

type CreatePlanProps = {
  name: string;
  price: number;
  description: string;
  features: string[];
  duration: number;
  userLimit: number | null;
};

type UpdatePlanProps = {
  name: string;
  price: number;
  active: boolean;
  description: string;
  features: string[];
  duration: number;
  userLimit: number | null;
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
      userLimit: props.userLimit,
      active: true,
      description: props.description,
      features: props.features,
      stripeProductId: null,
      stripePriceId: null,
    });
  }

  // Chamado pelo use case depois de criar/atualizar o Product+Price
  // correspondente no Stripe (ou de arquivar, quando o plano deixa de ser
  // pago) — não faz parte de create()/update() porque depende de uma
  // chamada assíncrona à API do Stripe, feita fora da entidade.
  assignStripeIds(stripeProductId: string | null, stripePriceId: string | null): void {
    this.stripeProductId = stripeProductId;
    this.stripePriceId = stripePriceId;
  }

  update(props: UpdatePlanProps): void {
    this.name = props.name;
    this.price = props.price;
    this.description = props.description;
    this.features = props.features;
    this.active = props.active;
    this.duration = props.duration;
    this.userLimit = props.userLimit;
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
