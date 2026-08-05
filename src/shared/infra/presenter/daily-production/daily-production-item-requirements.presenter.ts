import { ApiProperty } from '@nestjs/swagger';
import { TypeConsumptionUnit } from '@/shared/infra/enums/product';

export class DailyProductionItemRequirementPresenter {
  @ApiProperty({ description: 'Id da matéria-prima' })
  readonly materialId: string;

  @ApiProperty({ description: 'Nome da matéria-prima' })
  readonly materialName: string;

  @ApiProperty({ description: 'Quantidade da matéria-prima na receita base' })
  readonly recipeQuantity: number;

  @ApiProperty({
    description: 'Quantidade necessária para a quantidade planejada do item',
  })
  readonly requiredQuantity: number;

  @ApiProperty({ description: 'Unidade de consumo da matéria-prima', enum: TypeConsumptionUnit })
  readonly consumerUnit: TypeConsumptionUnit | null;
}

export class DailyProductionItemRequirementsPresenter {
  @ApiProperty({
    description: 'Matérias-primas necessárias',
    type: [DailyProductionItemRequirementPresenter],
  })
  readonly items: DailyProductionItemRequirementPresenter[];
}
