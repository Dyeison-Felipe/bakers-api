import { ApiProperty } from "@nestjs/swagger";

export class UpdateStockProductPresenter {
   @ApiProperty({ description: 'Id do produto' })
  readonly id: string
}