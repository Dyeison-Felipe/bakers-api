import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Payment } from '../entities/payment.entity';

export interface PaymentRepository extends BaseRepository<Payment> {
  save(entity: Payment): Promise<Payment>;
}
