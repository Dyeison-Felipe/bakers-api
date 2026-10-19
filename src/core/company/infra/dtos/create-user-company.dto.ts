import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsEmailDomain } from '@/shared/infra/validators/is-email-domain.decorator';

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
  @MinLength(8)
  @MaxLength(100)
  @ApiProperty({
    example: '********',
    description: 'Senha do usuário',
    format: 'string',
  })
  password: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @IsEmailDomain()
  @ApiProperty({
    example: 'email@email.com',
    description: 'E-mail do usuário',
    format: 'string',
  })
  email: string;
}
