import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CheckEmailDomainDto {
  @ApiProperty({ description: 'E-mail a verificar', example: 'contato@padaria.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}
