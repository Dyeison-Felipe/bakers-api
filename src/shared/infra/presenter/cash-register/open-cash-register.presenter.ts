import { ApiProperty } from '@nestjs/swagger';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export class OpenCashRegisterPresenter {
  @ApiProperty({ description: 'Id do caixa aberto' })
  readonly id: string;

  @ApiProperty({ enum: TypeCashRegisterSessionStatus })
  readonly status: TypeCashRegisterSessionStatus;

  @ApiProperty({ description: 'Valor de abertura do caixa' })
  readonly openingAmount: number;

  @ApiProperty({ description: 'Data/hora de abertura' })
  readonly openedAt: Date;
}
