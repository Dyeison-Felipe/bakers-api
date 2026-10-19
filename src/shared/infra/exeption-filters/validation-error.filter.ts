import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import type { FastifyRequest, FastifyReply } from 'fastify';
import { EntityValidationError } from '@/shared/application/errors/validation-error';

// Atende tanto os erros de DTO (ValidationPipe → exceptionFactory) quanto os
// de domínio (validators das entidades): mesmo formato, mensagens em pt-BR.
@Catch(EntityValidationError)
export class EntityValidationErrorFilter implements ExceptionFilter {
  catch(exception: EntityValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).send({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Validation Error',
      message: exception.message,
      errors: exception.error,
      path: request.url,
    });
  }
}
