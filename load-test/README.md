# Teste de carga — Baker's Bill API

Guia passo a passo pra rodar o teste de carga e gerar os gráficos do apêndice
do TCC: tempo de resposta ao longo do teste, taxa de erro e uso de CPU/memória.

## O que tem aqui

- `script.js` — script de carga (k6). Faz login uma vez e bate só em `GET`s
  nos módulos principais (categoria, produto, produção diária, PDV,
  desperdício, relatórios). **Não faz nenhum `POST`/`PUT`/`PATCH`/`DELETE`**,
  de propósito, pra não criar/alterar vendas, produções ou descartes reais no
  banco do seu servidor.
- `monitor-docker-stats.sh` — roda **no servidor**, ao lado do container da
  API, e grava CPU%/memória num CSV enquanto o teste acontece.
- `chart-viewer.html` — página local (abre no navegador, sem precisar de
  servidor) que lê o CSV do passo anterior e desenha o gráfico de CPU/memória.

## 0. Antes de tudo — aviso importante

O teste vai bater no seu servidor de verdade (o container `bakers_api_container`
em produção/homologação). Recomendado:

- Rodar fora do horário de maior uso, se o sistema já tiver usuários reais.
- Começar com poucos usuários virtuais (VUs) e ir aumentando aos poucos —
  não saia direto rodando com carga alta.
- Fazer sempre um **smoke test** (passo 2) antes da carga cheia, pra garantir
  que o script está batendo nos endpoints certos e não gerando erro em massa.

## 1. Instalar o k6

Na máquina que vai **gerar** a carga (pode ser seu computador, não precisa
ser o servidor):

- Windows: `winget install k6` (ou baixe o instalador em https://k6.io/docs/get-started/installation/)
- Confirme com: `k6 version`

## 2. Smoke test (1 usuário, 10 segundos)

Rode primeiro contra a API local (`pnpm dev`, escuta em `localhost:3334`) ou
direto contra o servidor com poucos VUs, só pra validar que tudo funciona:

```bash
k6 run --vus 1 --duration 10s \
  -e BASE_URL=http://localhost:3334/api \
  -e EMAIL=seu-usuario-de-teste@empresa.com \
  -e PASSWORD=sua-senha \
  script.js
```

Se aparecer `checks_succeeded: 100%` no resumo, o script está OK.

> O usuário/senha precisa ser de um usuário real já cadastrado no sistema,
> com permissão de leitura nos módulos testados (um usuário admin/dono da
> empresa resolve).

## 3. No servidor: iniciar o monitoramento de CPU/memória

Conecte por SSH no servidor onde o `bakers_api_container` está rodando, copie
o `monitor-docker-stats.sh` pra lá, dê permissão de execução e rode **um
pouco antes** de disparar o k6:

```bash
chmod +x monitor-docker-stats.sh
./monitor-docker-stats.sh
```

Deixe rodando (ele fica imprimindo/gravando até você apertar `Ctrl+C`). Ele
grava um CSV do tipo `load-test-stats-20260101-153000.csv` na pasta atual.

## 4. Rodar o teste de carga completo

Na máquina que vai gerar a carga, contra o domínio público real do servidor:

```bash
k6 run --out web-dashboard --out "web-dashboard=export=report.html" \
  -e BASE_URL=https://SEU-DOMINIO/api \
  -e EMAIL=seu-usuario-de-teste@empresa.com \
  -e PASSWORD=sua-senha \
  script.js
```

Isso gera um `report.html` com gráficos prontos de **tempo de resposta ao
longo do teste** e **taxa de erro** — é esse arquivo que você abre no
navegador e tira o print pro apêndice.

Ajuste os `stages` dentro de `script.js` se quiser mais ou menos carga
(número de usuários virtuais e duração de cada fase).

## 5. Parar o monitoramento e gerar o gráfico de CPU/memória

Depois que o k6 terminar, volte no servidor e aperte `Ctrl+C` no
`monitor-docker-stats.sh`. Copie o CSV gerado pro seu computador.

Abra o `chart-viewer.html` (duplo clique, abre no navegador — não precisa de
servidor nem instalar nada) e carregue o CSV. Ele mostra o gráfico de
CPU (%) e memória (MB) ao longo do tempo, com média e pico — print disso é o
terceiro gráfico do apêndice.

## Resumo dos 3 gráficos pedidos

| Gráfico | Onde sai |
|---|---|
| Tempo de resposta ao longo do teste | `report.html` gerado pelo k6 (passo 4) |
| Taxa de erro | `report.html` gerado pelo k6 (passo 4) |
| Uso de CPU e memória | `chart-viewer.html` + CSV do `monitor-docker-stats.sh` (passo 5) |
