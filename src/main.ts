import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PROVIDERS } from './shared/application/constants/providers';
import { INestApplication } from '@nestjs/common';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { globalConfig } from './global-config';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const envConfig = app.get(PROVIDERS.ENV_CONFIG_SERVICE);

  globalConfig(app, envConfig);

  console.log(`Server is running in port ${envConfig.getPort()}`)

  await app.listen(envConfig.getPort() ?? '0.0.0.0');
}
bootstrap();
