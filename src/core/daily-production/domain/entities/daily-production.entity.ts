import { Company } from '@/core/company/domain/entities/company.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionValidatorFactory } from '../validator/daily-production-validator';

export type DailyProductionProps = {
  company: Company | null;
  productionDate: Date;
  status: TypeDailyProductionStatus;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateDailyProductionProps = {
  company: Company;
  productionDate: Date;
  createdBy: string;
};

export interface DailyProduction extends DailyProductionProps {}

@Data()
export class DailyProduction extends BaseEntity<DailyProductionProps> {
  protected validate(): void {
    const validator = DailyProductionValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateDailyProductionProps): DailyProduction {
    return new DailyProduction({
      id: crypto.randomUUID(),
      company: props.company,
      productionDate: props.productionDate,
      status: TypeDailyProductionStatus.OPEN,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }

  complete(updatedBy: string): void {
    this.status = TypeDailyProductionStatus.COMPLETED;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }
}
