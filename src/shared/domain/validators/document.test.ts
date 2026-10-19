import { isValidCnpj, isValidCpf } from './document';

describe('document validators', () => {
  describe('isValidCpf', () => {
    it('should accept valid CPFs, with or without mask', () => {
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('should reject wrong check digits, repeated sequences and wrong length', () => {
      expect(isValidCpf('52998224726')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('1234567890')).toBe(false);
      expect(isValidCpf(undefined)).toBe(false);
    });
  });

  describe('isValidCnpj', () => {
    it('should accept valid CNPJs, with or without mask', () => {
      expect(isValidCnpj('11222333000181')).toBe(true);
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    });

    it('should reject wrong check digits, repeated sequences and wrong length', () => {
      expect(isValidCnpj('11222333000182')).toBe(false);
      expect(isValidCnpj('00000000000000')).toBe(false);
      expect(isValidCnpj('1122233300018')).toBe(false);
      expect(isValidCnpj(null)).toBe(false);
    });
  });
});
