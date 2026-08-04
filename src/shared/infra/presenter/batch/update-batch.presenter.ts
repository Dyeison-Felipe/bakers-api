import { ApiProperty } from '@nestjs/swagger';

export class UpdateBatchPresenter {
  @ApiProperty({ description: 'Id do lote atualizado' })
  readonly id: string;
}
