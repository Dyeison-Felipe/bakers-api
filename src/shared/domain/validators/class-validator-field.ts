
import { FieldsError, ValidatorFieldsInterface } from '@/shared/application/validators/validator-field.interface';
import { validateSync } from 'class-validator';
import { flattenValidationErrors } from './validation-messages';

export abstract class ClassValidatorFields<
  PropsValidated,
> implements ValidatorFieldsInterface<PropsValidated> {
  errors: FieldsError = {};
  validatedData: PropsValidated = {} as PropsValidated;

  validate(data: any): boolean {
    const errors = validateSync(data);

    if (errors.length) {
      // Mensagens já traduzidas para pt-BR (ver validation-messages.ts)
      this.errors = flattenValidationErrors(errors);
    } else {
      this.validatedData = data;
    }

    return !errors.length;
  }
}
