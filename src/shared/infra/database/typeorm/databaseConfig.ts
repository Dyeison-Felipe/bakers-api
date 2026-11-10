import { DataSourceOptions } from 'typeorm';
import { EnvConfig } from '../../../application/env-config/env-config';
import { join } from 'path';

export const getDatabaseConfig = (
  configService: EnvConfig,
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.getDbHost(),
  port: +configService.getDbPort(),
  username: configService.getDbUser(),
  password: configService.getDbPassword(),
  database: configService.getDbName(),
  schema: configService.getSchema(),
  extra: {
    // timezone: o `now()` dos defaults (created_at etc.) grava o horário de
    // Brasília, o mesmo fuso do processo Node (src/timezone.ts). Sem isso o
    // banco usa o fuso do servidor (UTC em produção).
    options: `-c search_path=${configService.getSchema()} -c timezone=America/Sao_Paulo`,
  },
  entities: [
    join(__dirname, '../../../../core/**/infra/database/typeorm/schema/*.{ts,js}'),
    join(__dirname, '../../../../shared/infra/database/typeorm/schema/*.{ts,js}')
  ],
  migrations: [join(__dirname, './migrations/**.{ts,js}')],
  migrationsRun: true,
  logging: false,
  synchronize: false,
});
