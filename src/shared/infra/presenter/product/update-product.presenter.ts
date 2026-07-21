import { ApiProperty } from "@nestjs/swagger";

export class UpdateProductPresenter {
   @ApiProperty({ description: 'Id do produto' })
  readonly id: string
}