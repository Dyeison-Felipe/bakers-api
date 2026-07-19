import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ncm')
export class NcmSchema extends BaseSchema {
  @Column({ type: 'varchar', length: 8, unique: true })
  code: string;

  @Column({ name: 'description', type: 'text' })
  description: string;
}
