import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsCnpj } from '@/shared/domain/validators/decorators/is-document.decorator';
import { IsEmailDomain } from '@/shared/infra/validators/is-email-domain.decorator';
import { emptyStringToNull } from '@/shared/infra/utils/empty-string-to-null';

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

  @ApiProperty({ description: 'CNPJ da empresa (somente números)', maxLength: 14 })
  @IsString()
  @IsNotEmpty()
  @IsCnpj()
  cnpj: string;

  @ApiProperty({
    description: 'Inscrição estadual (opcional — empresas isentas não têm)',
    maxLength: 14,
    required: false,
  })
  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(14)
  stateRegistration?: string | null;

  @ApiProperty({ description: 'Email principal da empresa' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmailDomain()
  email: string;

  @ApiProperty({ description: 'Telefone da empresa (DDD + número, somente dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve ter DDD + número (10 ou 11 dígitos)' })
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
