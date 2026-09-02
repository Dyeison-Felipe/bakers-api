import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { PaymentProps } from '../entities/payment.entity';

export class PaymentRules {
  @IsString()
  @IsNotEmpty()
  companySubscriptionId: string;

  @IsOptional()
  @IsString()
  mercadoPagoPaymentId?: string | null;

  @IsIn(['initial', 'renewal'])
  type: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  statusDetail?: string | null;

  @IsNumber()
  amount: number;

  constructor(data: PaymentProps) {
    Object.assign(this, data);
  }
}

export class PaymentValidator extends ClassValidatorFields<PaymentRules> {
  validate(data: PaymentProps): boolean {
    return super.validate(new PaymentRules(data ?? ({} as PaymentProps)));
  }
}

export class PaymentValidatorFactory {
  static create(): PaymentValidator {
    return new PaymentValidator();
  }
}
