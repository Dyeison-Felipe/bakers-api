import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidCnpj, isValidCpf } from '../document';

export const IS_CPF = 'isCpf';
export const IS_CNPJ = 'isCnpj';

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: IS_CPF,
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isValidCpf(value),
      },
    });
  };
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: IS_CNPJ,
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isValidCnpj(value),
      },
    });
  };
}
