import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../application/env-config/env-config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvConfigService implements EnvConfig {
  constructor(private readonly envConfigService: ConfigService) {}

  getSupabaseUrl(): string {
    return this.envConfigService.get<string>('SUPABASE_URL') as string;
  }
  getSupabaseServiceKey(): string {
    return this.envConfigService.get<string>('SUPABASE_SERVICE_KEY') as string;
  }
  getSupabaseStorageBucket(): string {
    return this.envConfigService.get<string>('SUPABASE_STORAGE_BUCKET') as string;
  }

  getExpiresInSecondsForgotPassword(): number {
    return +(this.envConfigService.get<string>('JWT_EXPIRES_IN_FORGOT_PASSWORD') as string);
  }
  getJwtSecretForgotPassword(): string {
    return this.envConfigService.get<string>('JWT_SECRET_FORGOT_PASSWORD') as string;
  }

  getExpiresInSecondsEmailVerification(): number {
    return +(this.envConfigService.get<string>('JWT_EXPIRES_IN_EMAIL_VERIFICATION') as string);
  }
  getJwtSecretEmailVerification(): string {
    return this.envConfigService.get<string>('JWT_SECRET_EMAIL_VERIFICATION') as string;
  }
  getFrontendUrl(): string {
    return this.envConfigService.get<string>('FRONTEND_URL') as string;
  }

  getCookieSecret(): string {
    return this.envConfigService.get<string>('COOKIE_SECRET') as string;
  }
  getCookieSameSite(): string {
    return this.envConfigService.get<string>('COOKIE_SAME_SITE') as string;
  }
  getCookieSecure(): boolean {
    return this.envConfigService.get<string>('COOKIE_SECURE') === 'true';
  }
  getCookieDomain(): string {
    return this.envConfigService.get<string>('COOKIE_DOMAIN') as string;
  }
  getJwtSecret(): string {
    return this.envConfigService.get<string>('JWT_SECRET') as string;
  }
  getJwtExpiresInSeconds(): number {
    return +(this.envConfigService.get<string>('JWT_EXPIRES_IN') as string);
  }
  getSchema(): string {
    return this.envConfigService.get<string>('DB_SCHEMA') as string;
  }
  getSalts(): number {
    return +(this.envConfigService.get<string>('SALTS') as string);
  }
  getDbPort(): number {
    return +(this.envConfigService.get<string>('DB_PORT') as string);
  }
  getDbHost(): string {
    return this.envConfigService.get<string>('DB_HOST') as string;
  }
  getDbUser(): string {
    return this.envConfigService.get<string>('DB_USER') as string;
  }
  getDbPassword(): string {
    return this.envConfigService.get<string>('DB_PASSWORD') as string;
  }
  getDbName(): string {
    return this.envConfigService.get<string>('DB_NAME') as string;
  }
  getNodeEnv(): string {
    return this.envConfigService.get<string>('NODE_ENV') as string;
  }
  getAllowedOrigins(): string {
    return this.envConfigService.get<string>('ALLOWED_ORIGINS') as string;
  }

  getPort(): number {
    return +(this.envConfigService.get<string>('PORT') as string);
  }
}
