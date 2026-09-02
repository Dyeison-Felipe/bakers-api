import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { CompanySubscription } from '../entities/company-subscription.entity';

export interface CompanySubscriptionRepository
  extends BaseRepository<CompanySubscription> {
  findByMercadoPagoSubscriptionId(
    mercadoPagoSubscriptionId: string,
  ): Promise<CompanySubscription | null>;
  findActiveByCompanyId(companyId: string): Promise<CompanySubscription | null>;
  findAllPendingOlderThan(date: Date): Promise<CompanySubscription[]>;
}
