import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyStringToNull } from '@/shared/infra/utils/empty-string-to-null';

export class CreateAddressDto {
  @ApiPropertyOptional({ description: 'CEP da rua', maxLength: 8, example: '85532423' })
  @Transform(emptyStringToNull)
  @IsString()
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'CEP deve ter 8 dígitos' })
  cep?: string;

  @ApiProperty({ description: 'Nome do bairro', maxLength: 255, example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  neighborhood: string;

  @ApiProperty({ description: 'Nome da rua', maxLength: 255, example: 'Rua Catedral' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string;

  @ApiProperty({ description: 'Número do endereço', maxLength: 10, example: '130' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  number: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    maxLength: 255,
    example: 'Casa na cor azul com telhado no portão'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  complement?: string;

  @ApiPropertyOptional({ description: 'Latitude do endereço', example: 37.4267861 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude do endereço', example: -122.0806032 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ description: 'ID da cidade', maxLength: 40, example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', })
  @IsUUID()
  @IsNotEmpty()
  @MaxLength(40)
  cityId: string;
}
