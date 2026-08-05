import { Company } from '@/core/company/domain/entities/company.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  IsDate,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ExpenseProps } from '../entities/expense.entity';

export class ExpenseRules {
  @IsOptional()
  @IsInstance(Company)
  company: Company | null;

  @IsDate()
  date: Date;

  @IsNumber()
  @Min(0.01)
  value: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: ExpenseProps) {
    Object.assign(this, data);
  }
}

export class ExpenseValidator extends ClassValidatorFields<ExpenseRules> {
  validate(data: ExpenseProps): boolean {
    return super.validate(new ExpenseRules(data ?? {}));
  }
}

export class ExpenseValidatorFactory {
  static create(): ExpenseValidator {
    return new ExpenseValidator();
  }
}
