import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    example: 'admin',
    description: 'username do usuário',
    format: 'string',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    example: 'Fulano de Tal',
    description: 'Nome completo do usuário',
    format: 'string',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    example: '********',
    description: 'Senha do usuário',
    format: 'string',
  })
  password: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({
    example: 'email@email.com',
    description: 'E-mail do usuário',
    format: 'string',
  })
  email: string;
}
