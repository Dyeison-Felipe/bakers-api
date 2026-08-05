import { Expense } from '@/core/expense/domain/entities/expense.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { ExpenseSchema } from '../../schema/expense.schema';

export class ExpenseMapper {
  static toEntity(schema: ExpenseSchema): Expense {
    return new Expense({
      id: schema.id,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      date: schema.date,
      value: schema.value,
      description: schema.description,
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

  static toSchema(entity: Expense): ExpenseSchema {
    return ExpenseSchema.with({
      id: entity.id,
      company: { id: entity.company!.id } as ExpenseSchema['company'],
      date: entity.date,
      value: entity.value,
      description: entity.description,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
