import { CreateAddressDto } from '@/core/address/infra/dtos/create-address.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpf } from '@/shared/domain/validators/decorators/is-document.decorator';
import { IsEmailDomain } from '@/shared/infra/validators/is-email-domain.decorator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'João da Silva', description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '12345678900', description: 'CPF do cliente (somente números)' })
  @IsString()
  @IsNotEmpty()
  @IsCpf()
  cpf: string;

  @ApiProperty({ example: '42999998888', description: 'Telefone do cliente' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve ter DDD + número (10 ou 11 dígitos)' })
  phoneNumber: string;

  @ApiProperty({ example: 'joao@email.com', description: 'E-mail do cliente' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmailDomain()
  email: string;

  @ApiProperty({ type: () => CreateAddressDto, description: 'Endereço do cliente' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
