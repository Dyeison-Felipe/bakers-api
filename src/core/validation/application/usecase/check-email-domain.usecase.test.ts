import { CheckEmailDomainUseCase } from './check-email-domain.usecase';

describe('CheckEmailDomainUseCase unit tests', () => {
  it('should return the checker result', async () => {
    const checker = { hasValidDomain: jest.fn().mockResolvedValue(false) };
    const sut = new CheckEmailDomainUseCase(checker);

    await expect(sut.execute({ email: 'a@dominio-inexistente.com' })).resolves.toEqual({
      valid: false,
    });
    expect(checker.hasValidDomain).toHaveBeenCalledWith('a@dominio-inexistente.com');
  });
});
