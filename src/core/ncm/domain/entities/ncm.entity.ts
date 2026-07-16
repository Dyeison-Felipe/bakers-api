import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { NcmValidatorFactory } from '../validators/ncm-validator';
import { EntityValidationError } from '@/shared/application/errors/validation-error';

export type NcmProps = {
  code: string;
  description: string;
};

export interface Ncm extends NcmProps {}

@Data()
export class Ncm extends BaseEntity<NcmProps> {
  static create(props: NcmProps): Ncm {
    return new Ncm({
      id: crypto.randomUUID(),
      code: props.code,
      description: props.description,
    });
  }

  updateDescription(description: string): void {
    this.description = description;
    this.validate();
  }

  protected validate(): void {
    const validator = NcmValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
