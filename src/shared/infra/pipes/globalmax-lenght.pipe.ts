import {
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class GlobalStringLengthPipe implements PipeTransform {
  private readonly DEFAULT_MAX = 255;

  private readonly EXEMPT_FIELDS = new Set([
    'token',
    'accessToken',
    'refreshToken',
  ]);

  transform(value: any) {
    if (!value || typeof value !== 'object') return value;

    for (const [key, val] of Object.entries(value)) {
      if (this.EXEMPT_FIELDS.has(key)) continue;

      if (typeof val === 'string' && val.length > this.DEFAULT_MAX) {
        throw new BadRequestException(
          `Campo "${key}" excede tamanho máximo de ${this.DEFAULT_MAX}`
        );
      }
    }

    return value;
  }
}
