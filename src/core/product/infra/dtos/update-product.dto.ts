import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  TypeConsumptionUnit,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';

export class UpdateProductDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Referência de balança' })
  @IsOptional()
  @IsString()
  scaleReference?: string;

  @ApiProperty({ description: 'Código de barras do produto' })
  @IsString()
  @IsNotEmpty()
  barCode: string;

  @ApiProperty({ description: 'Código NCM (8 dígitos)' })
  @IsString()
  @IsNotEmpty()
  ncm: string;

  @ApiProperty({ description: 'Preço de custo' })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({ description: 'Preço de venda' })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({ description: 'Margem de lucro' })
  @IsNumber()
  @Min(0)
  profitPrice: number;

  @ApiProperty({
    description: 'Unidade de medida para venda',
    enum: TypeUnitOfMeasurement,
  })
  @IsEnum(TypeUnitOfMeasurement)
  unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({
    description: 'Unidade de consumo do produto',
    enum: TypeConsumptionUnit,
    example: TypeConsumptionUnit.UN,
  })
  @IsEnum(TypeConsumptionUnit)
  @IsOptional()
  consumerUnit: TypeConsumptionUnit;

  @ApiProperty({ description: 'Validade em dias' })
  @IsString()
  @IsOptional()
  expirationDateInDays: string;

  @ApiProperty({ description: 'Indica se o produto tem controle de estoque' })
  @IsBoolean()
  stockManagement: boolean;

  @ApiProperty({ description: 'Indica se o produto é de revenda' })
  @IsBoolean()
  resale: boolean;

  @ApiProperty({ description: 'Indica se o produto é matéria-prima' })
  @IsBoolean()
  rowMaterial: boolean;

  @ApiProperty({ description: 'Indica se o produto é de produção própria' })
  @IsBoolean()
  ownProduction: boolean;

  @ApiProperty({ description: 'Indica se é matéria-prima de revenda' })
  @IsBoolean()
  rowMaterialResale: boolean;

  @ApiProperty({ description: 'Estoque mínimo' })
  @IsNumber()
  @Min(0)
  stockMin: number;

  @ApiProperty({ description: 'Indica se o produto está ativo' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Descrição do produto' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Unidade de compra do produto',
    enum: TypeUnitOfPurchase,
  })
  @IsEnum(TypeUnitOfPurchase)
  purchaseUnit: TypeUnitOfPurchase;

  @ApiPropertyOptional({ description: 'Quantidade por unidade de compra' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Peso por unidade de compra' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Volume por unidade de compra' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({ description: 'ID da categoria do produto' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}
