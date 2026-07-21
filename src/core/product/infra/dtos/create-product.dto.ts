import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUnitOfMeasurement, TypeUnitOfPurchase } from '@/shared/infra/enums/product';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Pão Francês',
    maxLength: 255,
    required: true,
  })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Referência de balança do produto',
    example: 'PF001',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  scaleReference?: string;

  @ApiPropertyOptional({
    description: 'Código de barras do produto',
    example: '7891234567895',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  barCode?: string;

  @ApiProperty({
    description: 'Código NCM do produto',
    example: '19059090',
    maxLength: 8,
  })
  @IsString()
  @MaxLength(8)
  @IsNotEmpty()
  ncm: string;

  @ApiProperty({
    description: 'Preço de custo do produto',
    example: 0.35,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiPropertyOptional({
    description: 'Preço de venda do produto',
    example: 0.75,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Margem de lucro do produto',
    example: 0.4,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  profitPrice?: number;

  @ApiProperty({
    description: 'Unidade de medida do produto',
    enum: TypeUnitOfMeasurement,
    example: TypeUnitOfMeasurement.UN,
  })
  @IsEnum(TypeUnitOfMeasurement)
  @IsOptional()
  unitOfMeasurement?: TypeUnitOfMeasurement;

  @ApiPropertyOptional({
    description: 'Prazo de validade do produto em dias',
    example: '1',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  expirationDateInDays?: string;

  @ApiProperty({
    description: 'Indica se o produto possui controle de estoque',
    example: true,
  })
  @IsBoolean()
  stockManagement: boolean;

  @ApiProperty({
    description: 'Indica se o produto é de revenda',
    example: false,
  })
  @IsBoolean()
  resale: boolean;

  @ApiProperty({
    description: 'Indica se o produto é matéria-prima',
    example: false,
  })
  @IsBoolean()
  rowMaterial: boolean;

  @ApiProperty({
    description: 'Indica se o produto é de produção própria',
    example: true,
  })
  @IsBoolean()
  ownProduction: boolean;

  @ApiProperty({
    description: 'Indica se o produto é matéria-prima de revenda',
    example: false,
  })
  @IsBoolean()
  rowMaterialResale: boolean;

  @ApiPropertyOptional({
    description: 'Quantidade atual em estoque',
    example: 150,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Quantidade mínima em estoque',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMin?: number;

  @ApiProperty({
    description: 'Indica se o produto está ativo',
    example: true,
  })
  @IsBoolean()
  active: boolean;

  @ApiPropertyOptional({
    description: 'Descrição do produto',
    example: 'Pão francês tradicional, produção própria',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Unidade de compra do produto',
    enum: TypeUnitOfPurchase,
    example: TypeUnitOfPurchase.CX,
  })
  @IsEnum(TypeUnitOfPurchase)
  @IsOptional()
  purchaseUnit?: TypeUnitOfPurchase;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por unidade de compra',
    example: 12,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Peso por unidade de compra (kg)',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Volume por unidade de compra (L)',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({
    description: 'ID da categoria do produto',
    example: '89e32f83-55ba-447d-9776-8982ebeef1b6',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  category: string;
}
