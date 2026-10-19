import { isEmail, registerDecorator, ValidationOptions } from 'class-validator';
import { dnsEmailDomainChecker } from '@/shared/infra/email-domain/dns-email-domain-checker';

export const IS_EMAIL_DOMAIN = 'isEmailDomain';

// Validação assíncrona: consulta o DNS (registro MX) do domínio do e-mail.
// Fica só nos DTOs (camada infra) — os validators de domínio são síncronos e
// validam apenas o formato com @IsEmail.
export function IsEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: IS_EMAIL_DOMAIN,
      target: object.constructor,
      propertyName,
      async: true,
      options: validationOptions,
      validator: {
        async validate(value: unknown) {
          // Formato inválido já é reportado pelo @IsEmail; não duplica o erro.
          if (typeof value !== 'string' || !isEmail(value)) return true;
          return dnsEmailDomainChecker.hasValidDomain(value);
        },
      },
    });
  };
}
