import { EnvConfig } from '@/shared/application/env-config/env-config';

/**
 * Falha o boot da aplicação com um erro claro se uma variável de ambiente
 * sensível estiver ausente/vazia — em vez de deixar o app subir normalmente
 * e só quebrar (ou gerar criptografia fraca, ex. JWT assinado com secret
 * vazio) no primeiro uso em produção.
 */
export function validateRequiredEnvVars(envConfig: EnvConfig): void {
  const missing: string[] = [];

  if (!envConfig.getJwtSecret()) missing.push('JWT_SECRET');
  if (!envConfig.getJwtSecretForgotPassword()) missing.push('JWT_SECRET_FORGOT_PASSWORD');
  if (!envConfig.getJwtSecretEmailVerification()) missing.push('JWT_SECRET_EMAIL_VERIFICATION');
  if (!envConfig.getCookieSecret()) missing.push('COOKIE_SECRET');
  if (Number.isNaN(envConfig.getSalts())) missing.push('SALTS');
  if (!envConfig.getDbHost()) missing.push('DB_HOST');
  if (Number.isNaN(envConfig.getDbPort())) missing.push('DB_PORT');
  if (!envConfig.getDbUser()) missing.push('DB_USER');
  if (!envConfig.getDbPassword()) missing.push('DB_PASSWORD');
  if (!envConfig.getDbName()) missing.push('DB_NAME');
  if (Number.isNaN(envConfig.getPort())) missing.push('PORT');
  if (!envConfig.getNodeEnv()) missing.push('NODE_ENV');
  if (!envConfig.getAllowedOrigins()) missing.push('ALLOWED_ORIGINS');

  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes/vazias: ${missing.join(', ')}. ` +
        'Confira o .env do ambiente antes de subir a aplicação.',
    );
  }
}
