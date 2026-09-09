import { PermissionValidator, PermissionRules } from './permission-validator';

describe('PermissionValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new PermissionValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['action', 'description', 'subject'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new PermissionValidator();
    const validData = {
      action: 'create',
      description: 'Criar categoria',
      subject: 'category',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(PermissionRules);
  });
});
