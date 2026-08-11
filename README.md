# Baker's Bill — Backend

Sistema de gestão (ERP) para padarias, desenvolvido como Trabalho de Conclusão de Curso (TCC). Backend construído com NestJS seguindo princípios de Clean Architecture e DDD.

## 🚀 Tecnologias

- **Node.js** `v24.18.0`
- **NestJS** com adapter **Fastify**
- **TypeORM** + **PostgreSQL**
- **Clean Architecture** / **DDD** (Domain-Driven Design)
- **@casl/ability** — controle de permissões (autorização)
- **@fastify/multipart** — upload de arquivos (ex.: imagem de produto)
- **pdfkit** — geração de PDF (cupom não fiscal do PDV)
- **typeorm-transactional** — transações em operações multi-tabela
- **nest-winston** — logging
- **@nestjs-modules/mailer** + **handlebars** — envio de e-mail (recuperação de senha, verificação de e-mail)
- **@nestjs/swagger** — documentação da API

## 📋 Pré-requisitos

- Node.js `v24.18.0` (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- PostgreSQL (ou Docker, veja abaixo)
- pnpm

## ⚙️ Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Instale as dependências
pnpm install

# Copie o arquivo de variáveis de ambiente (o template real se chama example.env)
cp example.env .env.development
```

Configure as variáveis no `.env.development` (conexão com banco, JWT, e-mail, etc — veja a seção [Variáveis de ambiente](#-variáveis-de-ambiente)).

### Subindo o PostgreSQL local via Docker (opcional)

Se não tiver um PostgreSQL instalado localmente, o repositório traz um `docker-compose.yaml` só com o banco:

```bash
pnpm run containers:dev
```

Sobe um container Postgres 16 (`database_bakers_bill`) na porta `5431`, usando as variáveis `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `TZ` e `PGTZ` do seu `.env.development`.

## ▶️ Executando o projeto

```bash
# Desenvolvimento (com watch)
pnpm run dev

# Debug
pnpm run debug

# Build de produção
pnpm run build

# Rodar build já compilado
pnpm run prod
```

## 📖 Documentação da API

Com o servidor rodando, o Swagger fica disponível em `/api/docs` (o prefixo global da aplicação é `api`, configurado em `src/global-config.ts`).

## 🔐 Permissões

O controle de autorização usa **@casl/ability**. Cada domínio define suas permissões em `src/core/auth/domain/permissions-definition/{modulo}.ts` (ex.: `product.ts`, `sale.ts`, `batch.ts`), agregadas em `permissions.ts`. As rotas são protegidas via `PermissionGuard` + decorator `@Permission()` no controller.

> ⚠️ Novas permissões exigem uma migration de insert na tabela `permission` — não há seed automático. Depois é preciso marcá-las manualmente na tela de Planos (frontend) para liberá-las nos planos existentes.

## 🗄️ Migrations

As migrations rodam **automaticamente no boot da aplicação** (`migrationsRun: true`, `synchronize: false`, configurado em `src/shared/infra/database/typeorm/databaseConfig.ts`). Elas ficam em `src/shared/infra/database/typeorm/migrations/`.

Para criar uma nova migration hoje, adicione manualmente um arquivo nessa pasta seguindo o padrão dos existentes (nome com timestamp + descrição, classe implementando `MigrationInterface` com `up`/`down`). O projeto **não possui um `data-source.ts`** configurado para uso com a CLI padrão do TypeORM (`typeorm migration:create/run/revert -d ...`), então esses comandos não funcionam neste repositório no estado atual — a criação de migration é manual e a execução acontece automaticamente ao subir a aplicação.

> 📖 Referência de propriedades de colunas, índices, relações e demais atributos: [TypeORM Migrations API](https://typeorm.io/docs/migrations/api)

## 🧪 Testes

```bash
# Specs de integração (*.spec.ts), usa .env.test
pnpm run test

# Testes unitários por use case (*.test.ts), com fixtures.ts
pnpm run test:unit

# Watch mode
pnpm run test:watch

# Cobertura
pnpm run test:cov
```

> ⚠️ Existe um script `test:e2e` no `package.json`, mas ele referencia um config (`test/jest-e2e.json`) que ainda não existe no repositório — não está funcional hoje.

## 🔑 Variáveis de ambiente

Chaves presentes no template `example.env`:

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da aplicação |
| `NODE_ENV` | Ambiente (`development`, `test`, `production`) |
| `ALLOWED_ORIGINS` | Origens permitidas (CORS) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SCHEMA` | Conexão com o PostgreSQL |
| `SALTS` | Salt para hash |
| `JWT_EXPIRES_IN` / `JWT_SECRET` | Token de autenticação |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_SECRET` | Configuração de cookies |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASSWORD` / `MAIL_FROM` | Envio de e-mail |

> ⚠️ O código também referencia outras variáveis que **não estão no `example.env`** e precisam ser preenchidas manualmente no seu `.env.development`/`.env.test`: `STORAGE_PATH` (raiz de armazenamento de arquivos), `FRONTEND_URL`, `JWT_EXPIRES_IN_FORGOT_PASSWORD` / `JWT_SECRET_FORGOT_PASSWORD`, `JWT_EXPIRES_IN_EMAIL_VERIFICATION` / `JWT_SECRET_EMAIL_VERIFICATION`, `EMAIL` / `EMAIL_SEND_PASSWORD` (usadas pelo módulo de mailer, com nomes diferentes das `MAIL_*` acima — atenção a essa inconsistência), `TZ` e `PGTZ` (usadas pelo `docker-compose.yaml`).

## 📁 Estrutura do projeto

```
src/
├── @types/                            # Augmentações de tipos globais
├── core/                              # Módulos de domínio (22 no total)
│   ├── additional-cost/
│   ├── address/
│   ├── auth/                          # login, permissões (CASL), guards
│   ├── batch/                         # lotes/estoque, baixa por FEFO
│   ├── cash-register/                 # caixa do PDV (uma sessão OPEN por empresa)
│   ├── category/
│   ├── city/
│   ├── company/
│   ├── daily-production/              # produção diária (cabeçalho + itens)
│   ├── dashboard/
│   ├── expense/
│   ├── ncm/                           # código fiscal NCM (Siscomex)
│   ├── permission/
│   ├── plan/
│   ├── plan-permission/
│   ├── product/
│   ├── recipe/
│   ├── role/
│   ├── sale/                          # vendas/PDV
│   ├── state/
│   ├── user/
│   └── user-permission/
│
│   # Estrutura padrão de um módulo (exemplo real: core/product)
│   └── product/
│       ├── application/
│       │   ├── usecase/               # casos de uso (regras de aplicação)
│       │   ├── services/              # serviços de domínio (ex.: cálculo de custo/margem)
│       │   ├── queries/               # queries de leitura específicas
│       │   └── test/                  # testes unitários das use cases + fixtures.ts
│       ├── domain/
│       │   ├── entities/              # entidades de domínio (regras de negócio puras)
│       │   ├── repositories/          # interfaces (contratos) dos repositórios
│       │   └── validator/             # validações específicas do domínio
│       └── infra/
│           ├── controllers/           # controllers HTTP (Fastify/NestJS)
│           ├── dtos/                  # DTOs de entrada/saída da API
│           ├── database/typeorm/
│           │   ├── schema/            # definição das tabelas (EntitySchema)
│           │   └── repository/
│           │       ├── mappers/       # conversão entidade de domínio ↔ schema do banco
│           │       └── query/         # implementação das queries de leitura
│           ├── product.module.ts
│           └── product-persistence.module.ts   # módulo de persistência (repositórios/providers)
│
└── shared/                            # Código compartilhado entre módulos
    ├── application/                   # constants (providers), env-config, errors, hash,
    │                                   # helpers, jwt, logged-user, mail, output, siscomex,
    │                                   # storage, usecase, validators
    └── infra/                         # database/typeorm (module, config, migrations),
                                        # decorators, dto, env-config, exeption-filters,
                                        # hash, interceptors, jwt, logged-user, mail
                                        # (templates handlebars), pipes,
                                        # presenter/{modulo}/ (presenters de resposta por módulo),
                                        # siscomex, storage, utils
```

**Convenções por camada:**
- `application/usecase` — casos de uso (regras de aplicação)
- `application/services` — serviços de domínio reutilizados por vários use cases
- `application/queries` — queries de leitura específicas (fora do padrão CRUD do repositório)
- `application/test` — testes unitários das use cases, com `fixtures.ts` para dados de teste
- `domain/entities` — entidades de domínio (regras de negócio puras, sem dependência de infra)
- `domain/repositories` — interfaces (contratos) dos repositórios
- `domain/validator` — validações específicas do domínio
- `infra/controllers` — controllers HTTP (Fastify/NestJS)
- `infra/database/typeorm/schema` — definição das tabelas (EntitySchema)
- `infra/database/typeorm/repository` — implementação concreta do repositório
- `infra/database/typeorm/repository/mappers` — conversão entre entidade de domínio ↔ schema do banco
- `infra/database/typeorm/repository/query` — implementação de queries de leitura
- `infra/dtos` — DTOs de entrada/saída da API
- `infra/{modulo}.module.ts` — módulo NestJS (controllers, use cases, providers)
- `infra/{modulo}-persistence.module.ts` — módulo de persistência, separado para reuso dos repositórios por outros módulos
- `shared/infra/presenter/{modulo}/` — formatação da resposta HTTP a partir do output do use case

**Regra de tenant scoping:** toda query filtra por `company` via `LoggedUserService.getLoggedUser().company` — o `companyId` nunca é recebido do client.
