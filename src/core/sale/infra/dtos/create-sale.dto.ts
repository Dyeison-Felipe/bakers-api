import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { MONEY_MAX, QUANTITY_MAX } from '@/shared/domain/constants/field-limits';
import { IsCpf } from '@/shared/domain/validators/decorators/is-document.decorator';
import { emptyStringToNull } from '@/shared/infra/utils/empty-string-to-null';

export class SaleItemDto {
  @ApiProperty({ description: 'Id do produto vendido' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    description: 'Quantidade vendida (produtos por unidade/caixa)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Peso vendido em kg (produtos por peso)' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  weightInKg?: number;

  @ApiPropertyOptional({
    description:
      'Valor unitário praticado na venda (pode ser diferente do salePrice cadastrado, ex: venda com desconto). Se omitido, usa o salePrice do produto.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(MONEY_MAX)
  unitPrice?: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: () => SaleItemDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  @ArrayMinSize(1)
  items: SaleItemDto[];

  @ApiProperty({ enum: TypePaymentMethod })
  @IsEnum(TypePaymentMethod)
  paymentMethod: TypePaymentMethod;

  @ApiPropertyOptional({
    description: 'Valor entregue pelo cliente (obrigatório se pagamento em dinheiro)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  amountReceived?: number;

  @ApiPropertyOptional({ description: 'CPF do cliente, apenas dígitos (opcional)' })
  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @IsCpf()
  customerCpf?: string;

  @ApiPropertyOptional({
    description: 'Id do cliente cadastrado, se selecionado na busca (opcional)',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
