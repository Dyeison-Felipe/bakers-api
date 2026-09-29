import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubscribePlanDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Id do plano pago escolhido',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    description:
      'Id do PaymentMethod do Stripe, já confirmado no navegador (Payment Element + SetupIntent).',
  })
  @IsString()
  @IsNotEmpty()
  stripePaymentMethodId: string;
}
