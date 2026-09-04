import { CreateAddressDto } from '@/core/address/infra/dtos/create-address.dto';
import { CreateUserCompanyDto } from './create-user-company.dto';

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
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
    example: '12345678000190',
    description: 'CNPJ da empresa',
    maxLength: 14,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cnpj: string;

  @ApiProperty({
    example: '123456789',
    description: 'Inscrição estadual',
    maxLength: 14,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  stateRegistration: string;

  @ApiProperty({
    example: 'contato@padaria.com',
    description: 'Email principal da empresa',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '42999998888',
    description: 'Telefone da empresa',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  phoneNumber: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID do plano contratado',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  plan: string;

    @ApiProperty({
    type: () => CreateAddressDto,
    description: 'Endereço da empresa',
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiProperty({
    type: () => CreateUserCompanyDto,
    description: 'Usuário administrador da empresa',
  })
  @ValidateNested()
  @Type(() => CreateUserCompanyDto)
  user: CreateUserCompanyDto;
  
}