import { CreateAddressDto } from '@/core/address/infra/dtos/create-address.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCustomerDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Id do cliente' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '12345678900', description: 'CPF do cliente (somente números)' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos numéricos' })
  cpf: string;

  @ApiProperty({ example: '42999998888', description: 'Telefone do cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  phoneNumber: string;

  @ApiProperty({ example: 'joao@email.com', description: 'E-mail do cliente' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: () => CreateAddressDto, description: 'Endereço do cliente' })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
