import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('productDto inválido: não é um JSON válido');
    }
  }
}