import { UserValidator, UserRules } from './user-validator';

describe('UserValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new UserValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      [
        'username',
        'name',
        'email',
        'password',
        'active',
        'emailVerified',
        'role',
        'company',
      ].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new UserValidator();
    const validData = {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'senha1234',
      active: true,
      emailVerified: true,
      role: { id: 'role-1' },
      company: { id: 'company-1' },
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(UserRules);
  });
});
