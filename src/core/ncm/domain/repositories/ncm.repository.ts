import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Ncm } from '../entities/ncm.entity';


export interface NcmRepository extends BaseRepository<Ncm> {
  saveMany(entities: Ncm[]): Promise<void>;
  findManyByCodes(codes: string[]): Promise<Ncm[]>;
}
