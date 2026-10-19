import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

// Rate limit em memória por IP, para rotas públicas baratas de abusar
// (ex.: verificação de domínio de e-mail, que dispara consultas DNS).
@Injectable()
export class SimpleRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const key = request.ip ?? 'unknown';
    const now = Date.now();

    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.cleanup(now);
      return true;
    }

    entry.count += 1;
    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições. Tente novamente em instantes.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private cleanup(now: number) {
    if (this.hits.size < 1000) return;
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
  }
}
