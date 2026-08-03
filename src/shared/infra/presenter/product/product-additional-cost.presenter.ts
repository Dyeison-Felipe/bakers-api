import { ApiProperty } from "@nestjs/swagger";
import { AdditionalCostPresenter } from "../additional-cost/additional-cost.presenter";

export class ProductAdditionalCostPresenter {
  @ApiProperty({ description: 'Identificador do vínculo de custo adicional' })
  readonly id: string;

  @ApiProperty({ description: 'Valor do custo adicional' })
  readonly value: number;

  @ApiProperty({
    description: 'Custo adicional vinculado',
    type: () => AdditionalCostPresenter,
  })
  readonly additionalCost: AdditionalCostPresenter;
}