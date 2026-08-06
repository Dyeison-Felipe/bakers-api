import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token JWT recebido no link de verificação de e-mail',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
