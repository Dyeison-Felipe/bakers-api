import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { ClassValidatorFields } from '../../class-validator-field';

class StubRules {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
  constructor(data: { name: string; price: number }) {
    Object.assign(this, data);
  }
}

class StubClassValidatorFields extends ClassValidatorFields<StubRules> {
  validate(data: any): boolean {
    return super.validate(new StubRules(data));
  }
}

describe('ClassValidatorFields Integration test', () => {
  it('Should validate with errors', () => {
    const validator = new StubClassValidatorFields();

    expect(validator.validate({})).toBeFalsy();
    // console.log(validator.errors);
    expect(validator.errors).toStrictEqual({
      name: ['Nome é obrigatório'],
      price: ['Preço é obrigatório'],
    });
  });

  it('Should validate without errors', () => {
    const validator = new StubClassValidatorFields();

    expect(validator.validate({name: 'value', price: 3})).toBeTruthy();
    // console.log(validator.errors);
    expect(validator.validatedData).toStrictEqual(new StubRules({name: 'value', price: 3}));
  });
});
