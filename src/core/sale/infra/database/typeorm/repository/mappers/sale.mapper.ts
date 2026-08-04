import { Sale } from '@/core/sale/domain/entities/sale.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { CashRegisterSessionMapper } from '@/core/cash-register/infra/database/typeorm/repository/mappers/cash-register-session.mapper';
import { CashRegisterSessionSchema } from '@/core/cash-register/infra/database/typeorm/schema/cash-register-session.schema';
import { SaleSchema } from '../../schema/sale.schema';

export class SaleMapper {
  static toEntity(schema: SaleSchema): Sale {
    return new Sale({
      id: schema.id,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      cashRegisterSession: schema.cashRegisterSession
        ? CashRegisterSessionMapper.toEntity(schema.cashRegisterSession)
        : null,
      status: schema.status,
      paymentMethod: schema.paymentMethod,
      totalAmount: schema.totalAmount,
      amountReceived: schema.amountReceived,
      changeAmount: schema.changeAmount,
      customerCpf: schema.customerCpf,
      receiptPdfPath: schema.receiptPdfPath,
      soldBy: schema.soldBy,
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

  static toSchema(entity: Sale): SaleSchema {
    return SaleSchema.with({
      id: entity.id,
      company: { id: entity.company!.id } as CompanySchema,
      cashRegisterSession: {
        id: entity.cashRegisterSession!.id,
      } as CashRegisterSessionSchema,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      totalAmount: entity.totalAmount,
      amountReceived: entity.amountReceived,
      changeAmount: entity.changeAmount,
      customerCpf: entity.customerCpf,
      receiptPdfPath: entity.receiptPdfPath,
      soldBy: entity.soldBy,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
