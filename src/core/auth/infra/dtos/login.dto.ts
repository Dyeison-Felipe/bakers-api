import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Login que o usuário vai usar para acessar', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Confirma a substituição de uma sessão já ativa em outro navegador',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
