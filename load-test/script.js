// Script de teste de carga (k6) para a API do Baker's Bill.
//
// O que ele faz:
//   1. Faz login uma vez (setup) com um usuário real do sistema.
//   2. Em cada VU (usuário virtual), reaproveita o cookie de sessão do login.
//   3. Bate só em endpoints de LEITURA (GET) dos módulos principais —
//      categoria, produto, produção diária, PDV, desperdício e relatórios —
//      pra não criar/alterar nenhum dado real no banco durante o teste.
//
// Como rodar (veja o README.md desta pasta para o passo a passo completo):
//   k6 run -e BASE_URL=https://seu-dominio/api -e EMAIL=... -e PASSWORD=... script.js
//
// Gerar o relatório HTML com os gráficos de tempo de resposta e taxa de erro:
//   k6 run --out web-dashboard --out "web-dashboard=export=report.html" \
//     -e BASE_URL=... -e EMAIL=... -e PASSWORD=... script.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ---------------------------------------------------------------------------
// Configuração da carga — ajuste os estágios conforme quiser testar.
// Cada estágio é { duration, target }: sobe/desce o número de VUs (usuários
// virtuais simultâneos) até "target" ao longo de "duration".
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // rampa de subida suave
    { duration: '2m', target: 5 }, // carga sustentada leve
    { duration: '30s', target: 20 }, // rampa até um pico maior
    { duration: '2m', target: 20 }, // carga sustentada de pico
    { duration: '30s', target: 0 }, // rampa de descida
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% das respostas abaixo de 1s
    http_req_failed: ['rate<0.05'], // menos de 5% de requisições com erro
  },
};

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3334/api').replace(/\/+$/, '');
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;

// Janela de datas usada nos relatórios/desperdício (últimos 30 dias).
function formatDateOnly(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const DATE_TO = formatDateOnly(today);
const DATE_FROM = formatDateOnly(thirtyDaysAgo);

export function setup() {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Informe um usuário válido do sistema: -e EMAIL=... -e PASSWORD=...',
    );
  }

  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const loginOk = check(loginRes, {
    'login: status 200/201': (r) => r.status === 200 || r.status === 201,
  });

  if (!loginOk) {
    throw new Error(`Login falhou (status ${loginRes.status}): ${loginRes.body}`);
  }

  return { cookies: loginRes.cookies };
}

// Copia o(s) cookie(s) de sessão obtidos no login pro cookie jar deste VU,
// pra que as próximas requisições já saiam autenticadas.
function authenticateVU(cookies) {
  const jar = http.cookieJar();

  for (const [name, entries] of Object.entries(cookies)) {
    jar.set(BASE_URL, name, entries[0].value);
  }
}

export default function (data) {
  authenticateVU(data.cookies);

  group('categorias', () => {
    const res = http.get(`${BASE_URL}/v1/category`);
    check(res, { 'category: status 200': (r) => r.status === 200 });
  });

  group('produtos', () => {
    const res = http.get(`${BASE_URL}/v1/product`);
    check(res, { 'product: status 200': (r) => r.status === 200 });
  });

  group('producao diaria', () => {
    const res = http.get(`${BASE_URL}/v1/daily-production`);
    check(res, { 'daily-production: status 200': (r) => r.status === 200 });
  });

  group('pdv (vendas)', () => {
    const res = http.get(`${BASE_URL}/v1/sale`);
    check(res, { 'sale: status 200': (r) => r.status === 200 });
  });

  group('desperdicio', () => {
    const res = http.get(
      `${BASE_URL}/v1/batch/waste?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`,
    );
    check(res, { 'batch waste: status 200': (r) => r.status === 200 });
  });

  group('relatorios', () => {
    const wasteReport = http.get(
      `${BASE_URL}/v1/report/waste?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`,
    );
    check(wasteReport, { 'report waste: status 200': (r) => r.status === 200 });

    const productionReport = http.get(
      `${BASE_URL}/v1/report/production?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`,
    );
    check(productionReport, {
      'report production: status 200': (r) => r.status === 200,
    });

    const cashRegisterReport = http.get(
      `${BASE_URL}/v1/report/cash-register?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`,
    );
    check(cashRegisterReport, {
      'report cash-register: status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
