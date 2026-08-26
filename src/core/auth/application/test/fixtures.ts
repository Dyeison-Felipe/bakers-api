import { UserEntity } from '@/core/user/domain/entities/user.entity';
import type { EnvConfig } from '@/shared/application/env-config/env-config';

// Mesmo padrão do fixtures.ts de user/batch: propriedades próprias +
// prototype religado, pra métodos reais da entidade (update, verifyEmail,
// updatePassword, updateResetPasswordCode) funcionarem sem passar pelo
// validate() do construtor.
export const makeUser = (overrides: Record<string, unknown> = {}): UserEntity => {
  const user = {
    id: 'user-1',
    username: 'joana',
    name: 'Joana Silva',
    email: 'joana@example.com',
    password: 'hashed-password',
    active: true,
    emailVerified: true,
    emailVerifiedAt: new Date() as Date | null,
    passwordResetCode: null as string | null,
    expiredAtCode: null as Date | null,
    role: { id: 'role-1', name: 'Funcionário' },
    company: { id: 'company-1' },
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    userPermissions: [] as unknown[],
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    update(props: { username: string; name: string; email: string; role: unknown; updatedBy: string }) {
      this.username = props.username;
      this.name = props.name;
      this.email = props.email;
      this.role = props.role as typeof this.role;
      this.updatedBy = props.updatedBy;
    },
    updatePassword(props: { password: string; updatedBy?: string }) {
      this.password = props.password;
      if (props.updatedBy) this.updatedBy = props.updatedBy;
    },
    inativateUser() {
      this.active = false;
    },
    verifyEmail() {
      this.emailVerified = true;
      this.emailVerifiedAt = new Date();
    },
    updateResetPasswordCode(code?: string) {
      this.passwordResetCode = code ?? null;
      this.expiredAtCode = code ? new Date(Date.now() + 3600_000) : null;
    },
    ...overrides,
  };
  Object.setPrototypeOf(user, UserEntity.prototype);
  return user as unknown as UserEntity;
};

export const makeEnvConfig = (
  overrides: Partial<Record<keyof EnvConfig, unknown>> = {},
): jest.Mocked<EnvConfig> => {
  return {
    getSupabaseUrl: jest.fn().mockReturnValue('https://project.supabase.co'),
    getSupabaseServiceKey: jest.fn().mockReturnValue('service-key'),
    getSupabaseStorageBucket: jest.fn().mockReturnValue('bakers-bill'),
    getExpiresInSecondsForgotPassword: jest.fn().mockReturnValue(3600),
    getJwtSecretForgotPassword: jest.fn().mockReturnValue('forgot-secret'),
    getExpiresInSecondsEmailVerification: jest.fn().mockReturnValue(3600),
    getJwtSecretEmailVerification: jest.fn().mockReturnValue('verify-secret'),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:5173'),
    getCookieSecret: jest.fn().mockReturnValue('cookie-secret'),
    getCookieSameSite: jest.fn().mockReturnValue('lax'),
    getCookieSecure: jest.fn().mockReturnValue(false),
    getCookieDomain: jest.fn().mockReturnValue('localhost'),
    getJwtSecret: jest.fn().mockReturnValue('jwt-secret'),
    getJwtExpiresInSeconds: jest.fn().mockReturnValue(86400),
    getDbPort: jest.fn().mockReturnValue(5432),
    getDbHost: jest.fn().mockReturnValue('localhost'),
    getDbUser: jest.fn().mockReturnValue('postgres'),
    getDbPassword: jest.fn().mockReturnValue('postgres'),
    getDbName: jest.fn().mockReturnValue('bakers'),
    getPort: jest.fn().mockReturnValue(3333),
    getNodeEnv: jest.fn().mockReturnValue('test'),
    getAllowedOrigins: jest.fn().mockReturnValue('*'),
    getSalts: jest.fn().mockReturnValue(10),
    getSchema: jest.fn().mockReturnValue('public'),
    ...overrides,
  } as unknown as jest.Mocked<EnvConfig>;
};
