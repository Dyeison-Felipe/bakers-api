import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';
import { MulterFile } from '@/shared/application/storage/multer-file.type';

@Injectable()
export class ParseMultipartInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const result: Record<string, any> = {};

    for await (const part of request.parts()) {
      if ('file' in part) {
        const buffer = await part.toBuffer();

        const file: MulterFile = {
          fieldname: part.fieldname,
          originalname: part.filename,
          encoding: part.encoding,
          mimetype: part.mimetype,
          buffer,
          size: buffer.length,
        };

        result[part.fieldname] = file;
      } else {
        try {
          result[part.fieldname] = JSON.parse(part.value as string);
        } catch {
          result[part.fieldname] = part.value;
        }
      }
    }

    request.body = result;

    return next.handle();
  }
}