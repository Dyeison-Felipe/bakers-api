import { Company } from '@/core/company/domain/entities/company.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { ExpenseValidatorFactory } from '../validators/expense-validator';

export type ExpenseProps = {
  company: Company | null;
  date: Date;
  value: number;
  description: string;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateExpenseProps = {
  company: Company;
  date: Date;
  value: number;
  description: string;
  createdBy: string;
};

type UpdateExpenseProps = {
  date: Date;
  value: number;
  description: string;
  updatedBy: string;
};

export interface Expense extends ExpenseProps {}

@Data()
export class Expense extends BaseEntity<ExpenseProps> {
  protected validate(): void {
    const validator = ExpenseValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateExpenseProps): Expense {
    return new Expense({
      id: crypto.randomUUID(),
      company: props.company,
      date: props.date,
      value: props.value,
      description: props.description,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }

  update(props: UpdateExpenseProps): void {
    this.date = props.date;
    this.value = props.value;
    this.description = props.description;
    this.updatedBy = props.updatedBy;
    this.updateTimestamp();
  }
}
