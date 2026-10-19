import { Injectable, PipeTransform } from '@nestjs/common';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { fieldLabel } from '@/shared/domain/validators/validation-messages';

@Injectable()
export class GlobalStringLengthPipe implements PipeTransform {
  private readonly DEFAULT_MAX = 255;

  private readonly EXEMPT_FIELDS = new Set([
    'token',
    'accessToken',
    'refreshToken',
    // limite próprio de 500 validado no DTO de movimentação de estoque
    'reasonDescription',
  ]);

  transform(value: any) {
    if (!value || typeof value !== 'object') return value;

    for (const [key, val] of Object.entries(value)) {
      if (this.EXEMPT_FIELDS.has(key)) continue;

      if (typeof val === 'string' && val.length > this.DEFAULT_MAX) {
        throw new EntityValidationError({
          [key]: [
            `${fieldLabel(key)} deve ter no máximo ${this.DEFAULT_MAX} caracteres`,
          ],
        });
      }
    }

    return value;
  }
}
