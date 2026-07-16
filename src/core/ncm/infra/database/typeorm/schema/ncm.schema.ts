import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ncm')
export class NcmSchema extends BaseSchema {
  @PrimaryColumn({ type: 'varchar', length: 8 })
  code: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;
}
