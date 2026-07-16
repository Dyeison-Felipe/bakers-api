import { Ncm } from '@/core/ncm/domain/entities/ncm.entity';
import { NcmSchema } from '../schema/ncm.schema';

export class NcmRepositoryMapper {
  static toEntity(schema: NcmSchema): Ncm {
    return new Ncm({
      id: schema.id,
      code: schema.code,
      description: schema.description,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: Ncm): NcmSchema {
    return NcmSchema.with({
      id: entity.id,
      code: entity.code,
      description: entity.description,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
