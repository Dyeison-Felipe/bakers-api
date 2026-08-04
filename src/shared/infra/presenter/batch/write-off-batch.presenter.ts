import { ApiProperty } from '@nestjs/swagger';

export class WriteOffBatchPresenter {
  @ApiProperty({ description: 'Id do produto que teve estoque baixado' })
  readonly productId: string;

  @ApiProperty({ description: 'Quantidade total baixada' })
  readonly totalWrittenOff: number;

  @ApiProperty({ description: 'Quantidade de lotes afetados pela baixa (FEFO)' })
  readonly batchesAffected: number;
}
