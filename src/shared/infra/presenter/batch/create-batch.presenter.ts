import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchPresenter {
  @ApiProperty({ description: 'Id do lote criado' })
  readonly id: string;
}
