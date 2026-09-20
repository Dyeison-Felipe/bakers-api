import { ApiProperty } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TopSellingProductOutput } from '@/shared/application/output/dashboard/top-selling-products.output';

export class TopSellingProductPresenter {
  @ApiProperty()
  readonly productId: string;

  @ApiProperty()
  readonly productName: string;

  @ApiProperty({ enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Quantidade vendida no dia (un ou kg)' })
  readonly quantitySold: number;

  constructor(props: TopSellingProductOutput) {
    this.productId = props.productId;
    this.productName = props.productName;
    this.unitOfMeasurement = props.unitOfMeasurement;
    this.quantitySold = props.quantitySold;
  }
}
