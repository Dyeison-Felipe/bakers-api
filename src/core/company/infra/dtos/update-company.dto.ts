import { CreateAddressDto } from '@/core/address/infra/dtos/create-address.dto';

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsCnpj } from '@/shared/domain/validators/decorators/is-document.decorator';
import { IsEmailDomain } from '@/shared/infra/validators/is-email-domain.decorator';
import { emptyStringToNull } from '@/shared/infra/utils/empty-string-to-null';

export class UpdateCompanyDto {
  @ApiProperty({
    example: 'Padaria Pão Quente',
    description: 'Nome fantasia da empresa',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fantasyName: string;

  @ApiProperty({
    example: 'Padaria Pão Quente LTDA',
    description: 'Razão social da empresa',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  socialReazon: string;

  @ApiProperty({
    example: '11222333000181',
    description: 'CNPJ da empresa (somente números)',
    maxLength: 14,
  })
  @IsString()
  @IsNotEmpty()
  @IsCnpj()
  cnpj: string;

  @ApiProperty({
    example: '123456789',
    description: 'Inscrição estadual (opcional — empresas isentas não têm)',
    maxLength: 14,
    required: false,
  })
  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(14)
  stateRegistration?: string | null;

  @ApiProperty({
    example: 'contato@padaria.com',
    description: 'Email principal da empresa',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmailDomain()
  email: string;

  @ApiProperty({
    example: '42999998888',
    description: 'Telefone da empresa (DDD + número, somente dígitos)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve ter DDD + número (10 ou 11 dígitos)' })
  phoneNumber: string;

  @ApiProperty({
    type: () => CreateAddressDto,
    description: 'Endereço da empresa',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
