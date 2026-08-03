import { ApiProperty } from '@nestjs/swagger';

export class CalculateUnitCostPresenter {
  @ApiProperty({ nullable: true })
  unitCostPrice: number | null;

  @ApiProperty({ nullable: true })
  pricePerKilogram: number | null;
}