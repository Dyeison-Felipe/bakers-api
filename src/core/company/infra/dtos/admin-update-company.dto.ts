import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminUpdateCompanyDto {
  @ApiProperty({ description: 'Nome fantasia da empresa', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fantasyName: string;

  @ApiProperty({ description: 'Razão social da empresa', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  socialReazon: string;

  @ApiProperty({ description: 'CNPJ da empresa', maxLength: 14 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cnpj: string;

  @ApiProperty({ description: 'Inscrição estadual', maxLength: 14 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  stateRegistration: string;

  @ApiProperty({ description: 'Email principal da empresa' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Telefone da empresa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  phoneNumber: string;

  @ApiProperty({ description: 'Se a empresa está ativa' })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @ApiProperty({
    description:
      'Novo plano a ser atribuído à empresa (renova a vigência a partir de agora). Se omitido, o plano atual é mantido.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  planId?: string;
}
