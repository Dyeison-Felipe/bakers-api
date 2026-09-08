import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepository } from '@/core/subscription/domain/repositories/payment.repository';
import { Payment } from '@/core/subscription/domain/entities/payment.entity';
import { PaymentSchema } from '../schema/payment.schema';
import { PaymentMapper } from './mapper/payment.mapper';

export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentSchema)
    private readonly repository: Repository<PaymentSchema>,
  ) {}

  async save(entity: Payment): Promise<Payment> {
    const schema = PaymentMapper.toSchema(entity);
    const saved = await this.repository.save(schema);
    return PaymentMapper.toEntity(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const schema = await this.repository.findOne({
      where: { id },
      relations: { companySubscription: { company: true, plan: true } },
    });
    if (!schema) return null;
    return PaymentMapper.toEntity(schema);
  }

  async update(entity: Payment): Promise<Payment> {
    const schema = PaymentMapper.toSchema(entity);
    const saved = await this.repository.save(schema);
    return PaymentMapper.toEntity(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
