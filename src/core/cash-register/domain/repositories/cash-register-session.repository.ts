import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { CashRegisterSession } from '../entities/cash-register-session.entity';

export interface CashRegisterSessionRepository
  extends BaseRepository<CashRegisterSession> {
  update(entity: CashRegisterSession): Promise<void>;

  findOpenByCompanyId(
    companyId: string,
  ): Promise<CashRegisterSession | null>;

  findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CashRegisterSession | null>;
}
