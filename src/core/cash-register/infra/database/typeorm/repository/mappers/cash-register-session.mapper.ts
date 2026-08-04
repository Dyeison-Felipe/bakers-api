import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { CashRegisterSessionSchema } from '../../schema/cash-register-session.schema';

export class CashRegisterSessionMapper {
  static toEntity(schema: CashRegisterSessionSchema): CashRegisterSession {
    return new CashRegisterSession({
      id: schema.id,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      status: schema.status,
      openingAmount: schema.openingAmount,
      openedAt: schema.openedAt,
      openedBy: schema.openedBy,
      closedAt: schema.closedAt,
      closedBy: schema.closedBy,
      totalCash: schema.totalCash,
      totalPix: schema.totalPix,
      totalCard: schema.totalCard,
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: CashRegisterSession): CashRegisterSessionSchema {
    return CashRegisterSessionSchema.with({
      id: entity.id,
      company: { id: entity.company!.id } as CompanySchema,
      status: entity.status,
      openingAmount: entity.openingAmount,
      openedAt: entity.openedAt,
      openedBy: entity.openedBy,
      closedAt: entity.closedAt,
      closedBy: entity.closedBy,
      totalCash: entity.totalCash,
      totalPix: entity.totalPix,
      totalCard: entity.totalCard,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
