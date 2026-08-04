import { ApiProperty } from '@nestjs/swagger';

export class MarkItemAsProducedPresenter {
  @ApiProperty({ description: 'Id do item marcado como produzido' })
  readonly id: string;

  @ApiProperty({ description: 'Id do lote criado a partir da produção do item' })
  readonly batchId: string;
}
