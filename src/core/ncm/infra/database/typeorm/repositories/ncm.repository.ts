import { NcmRepository } from '@/core/ncm/domain/repositories/ncm.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { NcmSchema } from '../schema/ncm.schema';
import { In, Repository } from 'typeorm';
import { Ncm } from '@/core/ncm/domain/entities/ncm.entity';
import { NcmRepositoryMapper } from './ncm-mapper';

export class NcmRepositoryImpl implements NcmRepository {
  constructor(
    @InjectRepository(NcmSchema)
    private readonly ncmRepository: Repository<NcmSchema>,
  ) {}

  async saveMany(entities: Ncm[]): Promise<void> {
    const schemas = entities.map((entity) =>
      NcmRepositoryMapper.toSchema(entity),
    );
    await this.ncmRepository.upsert(schemas, ['code']);
  }

   async findManyByCodes(codes: string[]): Promise<Ncm[]> {
    const schemas = await this.ncmRepository.find({
      where: { code: In(codes) },
    });
    return schemas.map(NcmRepositoryMapper.toEntity);
  }

  async save(entity: Ncm): Promise<Ncm> {
    const ncmSchema = NcmRepositoryMapper.toSchema(entity);

    const saveNcm = await this.ncmRepository.save(ncmSchema);

    const ncmEntity = NcmRepositoryMapper.toEntity(saveNcm);

    return ncmEntity;
  }

  async findById(id: string): Promise<Ncm | null> {
    const ncmSchema = await this.ncmRepository.findOne({
      where: { id },
    });

    if (!ncmSchema) return null;

    const ncmEntity = NcmRepositoryMapper.toEntity(ncmSchema);

    return ncmEntity;
  }

  async update(entity: Ncm): Promise<Ncm> {
    const ncmSchema = NcmRepositoryMapper.toSchema(entity);

    const saveNcm = await this.ncmRepository.save(ncmSchema);

    const ncmEntity = NcmRepositoryMapper.toEntity(saveNcm);

    return ncmEntity;
  }

  async delete(id: string): Promise<void> {
    await this.ncmRepository.softDelete(id);
  }
}
