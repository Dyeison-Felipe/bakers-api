import { ApiProperty } from '@nestjs/swagger';

export class CalculateRecipeCostPresenter {
  @ApiProperty()
  costPrice: number;
}