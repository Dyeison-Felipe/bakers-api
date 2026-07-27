// shared/infra/decorators/multipart.decorator.ts
import { UseInterceptors } from '@nestjs/common';
import { ParseMultipartInterceptor } from '../interceptors/fastify-file.interceptor';

export function Multipart() {
  return UseInterceptors(ParseMultipartInterceptor);
}