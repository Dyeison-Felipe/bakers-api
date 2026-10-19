import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { Type } from 'class-transformer';
import {
  MONEY_MAX,
  PERCENT_MAX,
  QUANTITY_MAX,
  UNIT_COST_MAX,
} from '@/shared/domain/constants/field-limits';
import { MulterFileDto } from '@/shared/infra/dto/multer-file';
import { AdditionalCostInputDto } from './additional-cost.dto';
import { RecipeLinkInputDto } from './recipe-link.dto';

export class UpdateProductDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

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
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  scaleReference?: string;

  @ApiPropertyOptional({
    description: 'Código de barras do produto (EAN13)',
    example: '7891234567895',
    pattern: '^\\d{13}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'Código de barras deve ter 13 dígitos numéricos (EAN13)',
  })
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
  @Max(MONEY_MAX)
  costPrice: number;

  @ApiProperty({
    description: 'Preço de custo unitário do produto',
    example: 0.35,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(UNIT_COST_MAX)
  unitCostPrice: number;

  @ApiProperty({
    description: 'Preço de custo por quilograma do produto',
    example: 0.35,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(MONEY_MAX)
  pricePerKilogram: number;

  @ApiPropertyOptional({
    description: 'Preço de venda do produto',
    example: 0.75,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Margem de lucro do produto',
    example: 0.4,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(PERCENT_MAX)
  profitPrice?: number;

  @ApiProperty({
    description: 'Unidade de medida do produto',
    enum: TypeUnitOfMeasurement,
    example: TypeUnitOfMeasurement.UN,
  })
  @IsEnum(TypeUnitOfMeasurement)
  @IsOptional()
  unitOfMeasurement?: TypeUnitOfMeasurement;

  @ApiProperty({
    description: 'Unidade de consumo do produto',
    enum: TypeConsumptionUnit,
    example: TypeConsumptionUnit.UN,
  })
  @IsEnum(TypeConsumptionUnit)
  @IsOptional()
  consumerUnit: TypeConsumptionUnit;

  @ApiPropertyOptional({
    description: 'Prazo de validade do produto em dias',
    example: '1',
    maxLength: 10,
  })
  @ValidateIf((o) => o.expirationDateInDays != null && o.expirationDateInDays !== '')
  @IsString()
  @MaxLength(10)
  @Matches(/^\d+$/, { message: 'Validade (dias) deve conter apenas números' })
  expirationDateInDays?: string;

  @ApiProperty({
    description: 'Indica se o produto possui controle de estoque',
    example: true,
  })
  @IsBoolean()
  stockManagement: boolean;

  @ApiProperty({
    description: 'Indica o tipo do produto',
    example: false,
  })
  @IsEnum(TypeProduct)
  @IsNotEmpty()
  typeProduct: TypeProduct;

  @ApiPropertyOptional({
    description: 'Quantidade atual em estoque',
    example: 150,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Quantidade mínima em estoque',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
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
  @Max(QUANTITY_MAX)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Peso por unidade de compra (kg)',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Volume por unidade de compra (L)',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(QUANTITY_MAX)
  volume?: number;

  @ApiProperty({
    description: 'ID da categoria do produto',
    example: '89e32f83-55ba-447d-9776-8982ebeef1b6',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Custos adicionais vinculados ao produto (produção própria)',
    type: [AdditionalCostInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostInputDto)
  additionalCost?: AdditionalCostInputDto[];

  @ApiPropertyOptional({
    description: 'Receitas reutilizáveis vinculadas ao produto (produção própria)',
    type: [RecipeLinkInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLinkInputDto)
  recipeLinks?: RecipeLinkInputDto[];
}

export class UpdateProductRequestDto {
  @ApiProperty({ description: 'Dados do produto' })
  @ValidateNested()
  @Type(() => UpdateProductDto)
  readonly productDto: UpdateProductDto;

  @ApiProperty({ description: 'Imagem do produto', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MulterFileDto)
  readonly image?: MulterFileDto;
}
