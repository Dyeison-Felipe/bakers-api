// src/mail/mail.module.ts
import { PROVIDERS } from '@/shared/application/constants/providers';
import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailServiceImpl } from './mail.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        // Mailpit (SMTP local sem autenticação) só em desenvolvimento e com
        // MAIL_HOST definido; em qualquer outro ambiente usa o Gmail normal.
        const useMailpit =
          config.get('NODE_ENV') === 'development' && !!config.get('MAIL_HOST');

        return {
          transport: useMailpit
            ? {
                host: config.get('MAIL_HOST'),
                port: Number(config.get('MAIL_PORT') ?? 1025),
                secure: false,
                ignoreTLS: true,
              }
            : {
                service: 'gmail',
                auth: {
                  user: config.get('EMAIL'),
                  pass: config.get('EMAIL_SEND_PASSWORD'),
                },
              },
          defaults: {
            from: `"Baker's Bill" <${config.get('EMAIL') ?? 'no-reply@bakersbill.local'}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: PROVIDERS.MAIL_SERVICE,
      useClass: MailServiceImpl
    }
  ],
  exports: [PROVIDERS.MAIL_SERVICE],
})
export class MailModule { }
