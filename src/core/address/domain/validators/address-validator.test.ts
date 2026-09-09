import { AddressValidator, AddressRules } from './address-validator';

describe('AddressValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new AddressValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['neighborhood', 'street', 'number', 'cityId', 'createdBy', 'updatedBy'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new AddressValidator();
    const validData = {
      neighborhood: 'Centro',
      street: 'Rua das Flores',
      number: '100',
      city: { id: '9f2c1e3a-1111-4a2b-8c3d-000000000001' },
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(AddressRules);
  });
});
