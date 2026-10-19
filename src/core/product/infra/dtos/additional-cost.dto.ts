import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { MONEY_MAX } from '@/shared/domain/constants/field-limits';

export class AdditionalCostInputDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  value: number;
}
