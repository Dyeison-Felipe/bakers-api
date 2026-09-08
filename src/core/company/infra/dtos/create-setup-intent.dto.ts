import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateSetupIntentDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Id do plano pago selecionado',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    example: 'contato@padaria.com',
    description: 'E-mail informado até o momento no formulário (opcional)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
