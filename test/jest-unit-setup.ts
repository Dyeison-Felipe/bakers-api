// Testes unitários de usecase não sobem um DataSource real — sem isso,
// qualquer usecase decorado com @Transactional() (typeorm-transactional)
// lança "No data sources defined..." mesmo com os repositórios mockados.
// Aqui o decorator vira um no-op: só executa o método original direto.
jest.mock('typeorm-transactional', () => {
  const actual = jest.requireActual('typeorm-transactional');
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) =>
        descriptor,
  };
});
