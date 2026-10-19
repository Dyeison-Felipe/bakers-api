import { promises as dns } from 'dns';
import { EmailDomainChecker } from '@/shared/application/email-domain/email-domain-checker.interface';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const DNS_TIMEOUT_MS = 3000;

// Códigos de erro do resolver que significam "o domínio não existe / não
// recebe e-mail" — qualquer outro código (ETIMEOUT, ESERVFAIL, ECONNREFUSED…)
// é tratado como falha de infraestrutura e não reprova o e-mail.
const NOT_FOUND_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN']);

export class DnsEmailDomainChecker implements EmailDomainChecker {
  private readonly cache = new Map<string, { valid: boolean; expiresAt: number }>();

  async hasValidDomain(email: string): Promise<boolean> {
    const domain = email?.split('@')[1]?.trim().toLowerCase();
    if (!domain) return false;

    const cached = this.cache.get(domain);
    if (cached && cached.expiresAt > Date.now()) return cached.valid;

    const valid = await this.resolve(domain);
    this.cache.set(domain, { valid, expiresAt: Date.now() + CACHE_TTL_MS });
    return valid;
  }

  private async resolve(domain: string): Promise<boolean> {
    try {
      const records = await this.withTimeout(dns.resolveMx(domain));
      // MX "nulo" (RFC 7505): domínio declara explicitamente que não recebe e-mail
      return records.some((record) => record.exchange && record.exchange !== '.');
    } catch (error: any) {
      if (error?.code === 'TIMEOUT') return true;
      if (NOT_FOUND_CODES.has(error?.code)) return false;
      return true;
    }
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Object.assign(new Error('DNS timeout'), { code: 'TIMEOUT' })),
        DNS_TIMEOUT_MS,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}

// Instância única compartilhada pelo decorator @IsEmailDomain (que roda fora
// do container de DI do Nest) e pelo provider EMAIL_DOMAIN_CHECKER, para os
// dois usarem o mesmo cache.
export const dnsEmailDomainChecker = new DnsEmailDomainChecker();
