import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
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
  costPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
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