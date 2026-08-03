import { IsNumber, IsUUID, Min } from 'class-validator';

export class AdditionalCostInputDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  value: number;
}
