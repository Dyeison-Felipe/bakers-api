import { ApiProperty } from '@nestjs/swagger';

export class MarkItemAsProducedPresenter {
  @ApiProperty({ description: 'Id do item marcado como produzido' })
  readonly id: string;
}
