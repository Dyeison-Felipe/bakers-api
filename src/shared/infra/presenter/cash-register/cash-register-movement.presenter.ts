import { ApiProperty } from '@nestjs/swagger';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';

export class CashRegisterMovementPresenter {
  @ApiProperty({ description: 'Id da movimentação' })
  readonly id: string;

  @ApiProperty({
    description: 'Tipo da movimentação',
    enum: TypeCashRegisterMovement,
  })
  readonly type: TypeCashRegisterMovement;

  @ApiProperty({
    description: 'Motivo da movimentação',
    enum: TypeCashRegisterMovementReason,
  })
  readonly reason: TypeCashRegisterMovementReason;

  @ApiProperty({ description: 'Descrição opcional', nullable: true })
  readonly description: string | null;

  @ApiProperty({ description: 'Valor movimentado' })
  readonly amount: number;

  @ApiProperty({ description: 'Saldo em caixa antes da movimentação' })
  readonly balanceBefore: number;

  @ApiProperty({ description: 'Saldo em caixa depois da movimentação' })
  readonly balanceAfter: number;

  @ApiProperty({ description: 'Data/hora da movimentação' })
  readonly createdAt: Date;
}
