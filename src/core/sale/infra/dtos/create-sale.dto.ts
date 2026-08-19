import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';

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
  quantity?: number;

  @ApiPropertyOptional({ description: 'Peso vendido em kg (produtos por peso)' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  weightInKg?: number;
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
  amountReceived?: number;

  @ApiPropertyOptional({ description: 'CPF do cliente, apenas dígitos (opcional)' })
  @IsOptional()
  @IsString()
  @Length(11, 11)
  customerCpf?: string;

  @ApiPropertyOptional({
    description: 'Id do cliente cadastrado, se selecionado na busca (opcional)',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
