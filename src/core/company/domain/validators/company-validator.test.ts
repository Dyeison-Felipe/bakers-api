import { CompanyValidator, CompanyRules } from './company-validator';

describe('CompanyValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new CompanyValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      [
        'fantasyName',
        'socialReazon',
        'cnpj',
        'email',
        'phoneNumber',
        'stateRegistration',
        'active',
        'planStartedAt',
        'planExpiresAt',
        'createdBy',
        'updatedBy',
      ].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new CompanyValidator();
    const validData = {
      fantasyName: 'Padaria Sabor',
      socialReazon: 'Padaria Sabor LTDA',
      cnpj: '12345678000199',
      email: 'contato@padariasabor.com',
      phoneNumber: '11999999999',
      stateRegistration: '123456789',
      active: true,
      planStartedAt: new Date('2026-01-01'),
      planExpiresAt: new Date('2026-12-31'),
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(CompanyRules);
  });
});
