import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'username do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  role: string;

  @ApiProperty({
    description: 'Senha do usuário',
    type: String,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'IDs das permissões do usuário',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionsId: string[];
}
