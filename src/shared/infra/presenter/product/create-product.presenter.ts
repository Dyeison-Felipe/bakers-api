import { ApiProperty } from "@nestjs/swagger";

export class CreateProductPresenter {
   @ApiProperty({ description: 'Id do produto' })
  readonly id: string
}