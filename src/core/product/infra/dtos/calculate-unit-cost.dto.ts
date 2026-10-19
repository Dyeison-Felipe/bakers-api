import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MONEY_MAX, QUANTITY_MAX } from '@/shared/domain/constants/field-limits';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';

export class CalculateUnitCostDto {
  @ApiProperty({ enum: TypeProduct })
  @IsEnum(TypeProduct)
  typeProduct: TypeProduct;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  costPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  volume?: number;

  @ApiProperty({ enum: TypeConsumptionUnit, required: false })
  @IsOptional()
  @IsEnum(TypeConsumptionUnit)
  consumerUnit?: TypeConsumptionUnit;

  @ApiProperty({ enum: TypeUnitOfMeasurement, required: false })
  @IsOptional()
  @IsEnum(TypeUnitOfMeasurement)
  unitOfMeasurement?: TypeUnitOfMeasurement;
}