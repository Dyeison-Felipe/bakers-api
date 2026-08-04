import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { CashRegisterSessionSchema } from '../schema/cash-register-session.schema';
import { CashRegisterSessionMapper } from './mappers/cash-register-session.mapper';

export class CashRegisterSessionRepositoryImpl
  implements CashRegisterSessionRepository
{
  constructor(
    @InjectRepository(CashRegisterSessionSchema)
    private readonly cashRegisterSessionRepository: Repository<CashRegisterSessionSchema>,
  ) {}

  async save(entity: CashRegisterSession): Promise<CashRegisterSession> {
    const schema = CashRegisterSessionMapper.toSchema(entity);
    const saved = await this.cashRegisterSessionRepository.save(schema);
    return this.findById(saved.id) as Promise<CashRegisterSession>;
  }

  async findById(id: string): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async findOpenByCompanyId(
    companyId: string,
  ): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: {
        company: { id: companyId },
        status: TypeCashRegisterSessionStatus.OPEN,
      },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async update(entity: CashRegisterSession): Promise<void> {
    const schema = CashRegisterSessionMapper.toSchema(entity);
    await this.cashRegisterSessionRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.cashRegisterSessionRepository.softDelete(id);
  }
}
