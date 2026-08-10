# Baker's Bill — Backend

Sistema de gestão (ERP) para padarias, desenvolvido como Trabalho de Conclusão de Curso (TCC). Backend construído com NestJS seguindo princípios de Clean Architecture e DDD.

## 🚀 Tecnologias

- **Node.js** `v24.18.0`
- **NestJS** com adapter **Fastify**
- **TypeORM** + **PostgreSQL**
- **Clean Architecture** / **DDD** (Domain-Driven Design)

## 📋 Pré-requisitos

- Node.js `v24.18.0` (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- PostgreSQL
- pnpm

## ⚙️ Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Instale as dependências
pnpm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env.development
```

Configure as variáveis no `.env.development` (conexão com banco, portas, etc).

## ▶️ Executando o projeto

```bash
# Desenvolvimento (com watch)
pnpm run dev

# Debug
pnpm run debug
```

## 🗄️ Migrations

### Criar uma nova migration

```bash
npx typeorm migration:create src/shared/infra/database/typeorm/migrations/migration-name
```

### Rodar as migrations pendentes

```bash
npx typeorm migration:run -d src/shared/infra/database/typeorm/data-source.ts
```

### Reverter a última migration

```bash
npx typeorm migration:revert -d src/shared/infra/database/typeorm/data-source.ts
```

> 📖 Documentação oficial com todas as propriedades para colunas, índices, relações e demais atributos de migration: [TypeORM Migrations API](https://typeorm.io/docs/migrations/api)

## 🧪 Testes

```bash
# Testes unitários
pnpm run test:unit
```

## 📁 Estrutura do projeto
```
src/
├── core/
│   └── [module]/                      # Ex: address, product, company...
│       ├── application/
│       │   ├── test/                  # Testes das use cases
│       │   │   ├── create-[module].test.ts
│       │   │   ├── find-[module]-by-id.test.ts
│       │   │   ├── update-[module].test.ts
│       │   │   └── fixtures.ts
│       │   └── usecase/
│       │       ├── create-[module].usecase.ts
│       │       ├── find-[module]-by-id.usecase.ts
│       │       └── update-[module].usecase.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   └── [module].entity.ts
│       │   ├── repositories/
│       │   │   └── [module].repository.ts
│       │   └── validators/
│       │       └── [module]-validator.ts
│       └── infra/
│           ├── controllers/
│           │   └── [module].controller.ts
│           ├── database/
│           │   └── typeorm/
│           │       ├── repository/
│           │       │   ├── mapper/
│           │       │   │   └── [module]-repository.mapper.ts
│           │       │   └── [module].repository.ts
│           │       └── schema/
│           │           └── [module].schema.ts
│           ├── dtos/
│           │   ├── create-[module].dto.ts
│           │   └── update-[module].dto.ts
│           └── [module].module.ts
└── shared/                            # Código compartilhado (infra, database, utils)
```



**Convenções por camada:**
- `application/usecase` — casos de uso (regras de aplicação)
- `application/test` — testes unitários das use cases, com `fixtures.ts` para dados de teste
- `domain/entities` — entidades de domínio (regras de negócio puras, sem dependência de infra)
- `domain/repositories` — interfaces (contratos) dos repositórios
- `domain/validators` — validações específicas do domínio
- `infra/controllers` — controllers HTTP (Fastify/NestJS)
- `infra/database/typeorm/schema` — definição das tabelas (EntitySchema)
- `infra/database/typeorm/repository` — implementação concreta do repositório
- `infra/database/typeorm/repository/mapper` — conversão entre entidade de domínio ↔ schema do banco
- `infra/dtos` — DTOs de entrada/saída da API