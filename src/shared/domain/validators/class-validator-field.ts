
import { FieldsError, ValidatorFieldsInterface } from '@/shared/application/validators/validator-field.interface';
import { validateSync } from 'class-validator';

export abstract class ClassValidatorFields<
  PropsValidated,
> implements ValidatorFieldsInterface<PropsValidated> {
  errors: FieldsError = {};
  validatedData: PropsValidated = {} as PropsValidated;

  validate(data: any): boolean {
    const errors = validateSync(data);

    if (errors.length) {
      this.errors = {};

      for (const error of errors) {
        const field = error.property
        this.errors[field] = Object.values(error.constraints ?? {});
      }
    } else {
      this.validatedData = data;
    }

    return !errors.length;
  }
}
