import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PROVIDERS } from './shared/application/constants/providers';
import { INestApplication } from '@nestjs/common';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { globalConfig } from './global-config';
import { validateRequiredEnvVars } from './shared/infra/env-config/validate-required-env-vars';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  // rawBody: true — o Nest passa a popular request.rawBody (Buffer) em toda
  // requisição, sem precisar registrar um content-type parser manual (que
  // colide com o parser JSON padrão que o próprio Nest registra depois, em
  // app.init()). Necessário pro webhook do Stripe validar a assinatura
  // contra os bytes exatos do corpo (stripe.webhooks.constructEvent).
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { rawBody: true },
  );

  // Sessão única por conta: SessionGateway usa WS puro (não socket.io) pra
  // avisar em tempo real quando uma sessão é derrubada por um novo login.
  app.useWebSocketAdapter(new WsAdapter(app));

  const envConfig = app.get(PROVIDERS.ENV_CONFIG_SERVICE);

  validateRequiredEnvVars(envConfig);

  await globalConfig(app, envConfig);

  console.log(`Server is running in port ${envConfig.getPort()}`)

  await app.listen(envConfig.getPort(), '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('BOOTSTRAP_FAILED:', err);
  process.exitCode = 1;
});
