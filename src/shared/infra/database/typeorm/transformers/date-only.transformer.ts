import { ValueTransformer } from 'typeorm';

export class DateOnlyColumnTransformer implements ValueTransformer {
  to(data: Date | null): Date | null {
    return data;
  }

  from(data: string | Date | null): Date | null {
    if (data === null || data === undefined) return null;
    return data instanceof Date ? data : new Date(data);
  }
}
