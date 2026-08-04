import { Company } from '@/core/company/domain/entities/company.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import {
  IsDate,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DailyProductionProps } from '../entities/daily-production.entity';

export class DailyProductionRules {
  @IsOptional()
  @IsInstance(Company)
  company: Company | null;

  @IsDate()
  productionDate: Date;

  @IsEnum(TypeDailyProductionStatus)
  status: TypeDailyProductionStatus;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: DailyProductionProps) {
    Object.assign(this, data);
  }
}

export class DailyProductionValidator extends ClassValidatorFields<DailyProductionRules> {
  validate(data: DailyProductionProps): boolean {
    return super.validate(new DailyProductionRules(data ?? {}));
  }
}

export class DailyProductionValidatorFactory {
  static create(): DailyProductionValidator {
    return new DailyProductionValidator();
  }
}
