// Teste de carga (k6) com o FLUXO COMPLETO de uma padaria no Baker's Bill.
//
// Diferente do script.js (que só faz leitura), este cria dados de verdade,
// na ordem em que o sistema é usado no dia a dia:
//
//   PREPARAÇÃO (setup — roda 1 vez, antes da carga):
//     1. Login (com force=true, derruba outra sessão aberta desse usuário).
//     2. Categoria do teste.
//     3. Matérias-primas (farinha, açúcar, fermento, manteiga, ovo, leite),
//        já com estoque inicial alto pra não faltar insumo durante a carga.
//     4. Receitas reutilizáveis ligando as matérias-primas.
//     5. Produtos de produção própria vinculados às receitas
//        (pão francês por KG, pão doce e bolo por UNIDADE).
//     6. Produto de revenda (refrigerante lata).
//     7. Abre o caixa (ou reaproveita o que já estiver aberto).
//
//   CARGA (cada usuário virtual repete, em loop):
//     1. Cria uma produção diária com os 3 produtos de produção própria.
//     2. Confirma a produção (produce-all) -> gera estoque e consome insumos.
//     3. Faz algumas vendas no PDV (PIX, cartão e dinheiro).
//     4. Registra um desperdício.
//     5. Lança uma despesa.
//     6. Consulta dashboard, listas e relatórios (como o dono faria).
//
//   ENCERRAMENTO (teardown — roda 1 vez, no fim):
//     Fecha o caixa usado durante o teste.
//
// Todos os nomes criados levam o sufixo do RUN (data/hora da execução), pra
// cada execução não conflitar com a anterior ("Produto X já está cadastrado").
//
// Como rodar (veja o README.md desta pasta):
//   Smoke (1 usuário, 1 iteração):
//     k6 run --vus 1 --iterations 1 -e BASE_URL=... -e EMAIL=... -e PASSWORD=... fluxo-completo.js
//   Carga completa com relatório HTML:
//     k6 run --out "web-dashboard=export=report.html" -e BASE_URL=... -e EMAIL=... -e PASSWORD=... fluxo-completo.js

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';

// ---------------------------------------------------------------------------
// Configuração da carga.
// Cada iteração de um VU faz ~15 requisições (várias delas de escrita), com
// pausas curtas entre as etapas simulando o tempo de um usuário real.
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // rampa de subida suave
    { duration: '2m', target: 5 }, // carga sustentada leve
    { duration: '30s', target: 20 }, // rampa até o pico
    { duration: '2m', target: 20 }, // carga sustentada de pico
    { duration: '30s', target: 0 }, // rampa de descida
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das respostas abaixo de 2s
    http_req_failed: ['rate<0.05'], // menos de 5% de requisições com erro
    checks: ['rate>0.95'],
  },
  // setup cria ~15 registros em sequência; dá folga caso o servidor esteja lento.
  setupTimeout: '2m',
};

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3334/api').replace(/\/+$/, '');
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
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
const DATE_RANGE = `dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`;

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Cookie de sessão (authToken) obtido no login do setup. É enviado à mão no
// cabeçalho Cookie de toda requisição: copiar pro cookie jar de cada VU com
// http.cookieJar().set() não funciona com o cookie da API (Domain do domínio
// pai + Secure) — a API respondia 401 em todas as requisições dos VUs.
let authCookie = null;

function withAuth(headers) {
  return authCookie ? { ...headers, Cookie: authCookie } : headers;
}

function postJson(path, body, name) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: withAuth(JSON_HEADERS),
    tags: { name: name || path },
  });
}

function patch(path, name) {
  return http.patch(`${BASE_URL}${path}`, null, {
    headers: withAuth({}),
    tags: { name: name || path },
  });
}

function getJson(path, name) {
  return http.get(`${BASE_URL}${path}`, {
    headers: withAuth({}),
    tags: { name: name || path },
  });
}

// O POST /v1/product é multipart (campo "productDto" com JSON + imagem
// opcional), igual o frontend envia via FormData. O k6 só gera multipart
// sozinho quando há arquivo no corpo, então o corpo é montado à mão aqui.
function postProductMultipart(productDto) {
  const boundary = `----bakersk6${Date.now()}${randomInt(1000, 9999)}`;
  const body =
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="productDto"\r\n\r\n' +
    `${JSON.stringify(productDto)}\r\n` +
    `--${boundary}--\r\n`;

  return http.post(`${BASE_URL}/v1/product`, body, {
    headers: withAuth({ 'Content-Type': `multipart/form-data; boundary=${boundary}` }),
    tags: { name: 'POST /v1/product' },
  });
}

// Usado no setup: se a criação falhar, não adianta seguir com a carga.
function requireId(res, label) {
  const ok = check(res, {
    [`setup: ${label} criado`]: (r) => r.status === 200 || r.status === 201,
  });

  if (!ok) {
    fail(`Falha ao criar ${label} (status ${res.status}): ${res.body}`);
  }

  return res.json('id');
}

// ---------------------------------------------------------------------------
// SETUP — cadastro base (roda 1 vez)
// ---------------------------------------------------------------------------
export function setup() {
  if (!EMAIL || !PASSWORD) {
    fail('Informe um usuário válido do sistema: -e EMAIL=... -e PASSWORD=...');
  }

  const RUN = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

  // 1. Login ----------------------------------------------------------------
  const loginRes = postJson(
    '/v1/auth/login',
    { email: EMAIL, password: PASSWORD, force: true },
    'POST /v1/auth/login',
  );

  if (!check(loginRes, { 'setup: login ok': (r) => r.status === 200 || r.status === 201 })) {
    fail(`Login falhou (status ${loginRes.status}): ${loginRes.body}`);
  }

  authCookie = `authToken=${loginRes.cookies.authToken[0].value}`;

  // 2. Categoria ------------------------------------------------------------
  const categoryId = requireId(
    postJson('/v1/category', { name: `Teste de carga ${RUN}` }, 'POST /v1/category'),
    'categoria',
  );

  // 3. Matérias-primas ------------------------------------------------------
  // costPrice = preço da embalagem de compra; quantity = nº de embalagens
  // nesse preço; weight/volume = conteúdo de cada embalagem na unidade de
  // consumo. O backend calcula unitCostPrice / pricePerKilogram a partir disso.
  // currentStock (na unidade de consumo) alto o bastante pra carga inteira.
  const rawMaterialBase = {
    typeProduct: 'RAW_MATERIAL',
    ncm: '11010010',
    unitCostPrice: 0,
    quantity: 1,
    stockManagement: true,
    currentStock: 1000000,
    active: true,
    category: categoryId,
  };

  const rawMaterials = {
    farinha: { name: 'Farinha de trigo', costPrice: 125, purchaseUnit: 'sc', consumerUnit: 'kg', weight: 25 },
    acucar: { name: 'Açúcar refinado', costPrice: 24, purchaseUnit: 'fd', consumerUnit: 'kg', weight: 5 },
    fermento: { name: 'Fermento biológico', costPrice: 18, purchaseUnit: 'pct', consumerUnit: 'kg', weight: 0.5 },
    manteiga: { name: 'Manteiga', costPrice: 45, purchaseUnit: 'cx', consumerUnit: 'kg', weight: 2 },
    ovo: { name: 'Ovo', costPrice: 22, purchaseUnit: 'cx', consumerUnit: 'un', quantity: 30 },
    leite: { name: 'Leite integral', costPrice: 6, purchaseUnit: 'un', consumerUnit: 'ml', volume: 1000 },
  };

  const raw = {};
  for (const [key, material] of Object.entries(rawMaterials)) {
    raw[key] = requireId(
      postProductMultipart({
        ...rawMaterialBase,
        ...material,
        name: `${material.name} ${RUN}`,
      }),
      `matéria-prima ${material.name}`,
    );
  }

  // 4. Receitas -------------------------------------------------------------
  // Quantidades na unidade de consumo de cada matéria-prima (kg, un, ml).
  const recipes = {
    massaPaoFrances: requireId(
      postJson(
        '/v1/recipe',
        {
          name: `Massa pão francês ${RUN}`,
          items: [
            { id: raw.farinha, quantity: 1 },
            { id: raw.fermento, quantity: 0.02 },
            { id: raw.acucar, quantity: 0.01 },
          ],
        },
        'POST /v1/recipe',
      ),
      'receita massa pão francês',
    ),
    massaPaoDoce: requireId(
      postJson(
        '/v1/recipe',
        {
          name: `Massa pão doce ${RUN}`,
          items: [
            { id: raw.farinha, quantity: 1 },
            { id: raw.acucar, quantity: 0.2 },
            { id: raw.manteiga, quantity: 0.1 },
            { id: raw.ovo, quantity: 2 },
            { id: raw.leite, quantity: 300 },
            { id: raw.fermento, quantity: 0.03 },
          ],
        },
        'POST /v1/recipe',
      ),
      'receita massa pão doce',
    ),
    massaBolo: requireId(
      postJson(
        '/v1/recipe',
        {
          name: `Massa bolo ${RUN}`,
          items: [
            { id: raw.farinha, quantity: 0.5 },
            { id: raw.acucar, quantity: 0.4 },
            { id: raw.manteiga, quantity: 0.2 },
            { id: raw.ovo, quantity: 6 },
            { id: raw.leite, quantity: 250 },
          ],
        },
        'POST /v1/recipe',
      ),
      'receita massa bolo',
    ),
  };

  // 5. Produtos de produção própria (vinculados às receitas) ----------------
  // KG: weight = rendimento (kg) de 1 receita; produzido via recipeMultiplier.
  // UN: quantity = rendimento (unidades) de 1 receita; produzido via plannedQuantity.
  const ownProductionBase = {
    typeProduct: 'OWN_PRODUCTION',
    ncm: '19059090',
    costPrice: 0,
    unitCostPrice: 0,
    expirationDateInDays: '2',
    active: true,
    category: categoryId,
  };

  const paoFrances = requireId(
    postProductMultipart({
      ...ownProductionBase,
      name: `Pão francês ${RUN}`,
      unitOfMeasurement: 'kg',
      weight: 1.4,
      salePrice: 18.9,
      stockManagement: false,
      recipeLinks: [{ id: recipes.massaPaoFrances }],
    }),
    'produto pão francês (kg)',
  );

  const paoDoce = requireId(
    postProductMultipart({
      ...ownProductionBase,
      name: `Pão doce ${RUN}`,
      unitOfMeasurement: 'un',
      quantity: 20,
      salePrice: 3.5,
      stockManagement: true,
      stockMin: 10,
      recipeLinks: [{ id: recipes.massaPaoDoce }],
    }),
    'produto pão doce (un)',
  );

  const bolo = requireId(
    postProductMultipart({
      ...ownProductionBase,
      name: `Bolo caseiro ${RUN}`,
      unitOfMeasurement: 'un',
      quantity: 1,
      salePrice: 35,
      stockManagement: true,
      stockMin: 2,
      recipeLinks: [{ id: recipes.massaBolo }],
    }),
    'produto bolo (un)',
  );

  // 6. Produto de revenda ---------------------------------------------------
  const refrigerante = requireId(
    postProductMultipart({
      typeProduct: 'RESALE',
      ncm: '22021000',
      name: `Refrigerante lata ${RUN}`,
      costPrice: 36,
      quantity: 12,
      unitCostPrice: 0,
      unitOfMeasurement: 'un',
      purchaseUnit: 'fd',
      salePrice: 6,
      stockManagement: true,
      currentStock: 1000000,
      active: true,
      category: categoryId,
    }),
    'produto revenda refrigerante',
  );

  // 7. Caixa ----------------------------------------------------------------
  // Só pode haver 1 caixa aberto por empresa: reaproveita se já existir.
  let cashRegisterId = null;

  const openRes = getJson('/v1/cash-register/open', 'GET /v1/cash-register/open');
  const openSession = openRes.status === 200 && openRes.body ? openRes.json() : null;

  if (openSession && openSession.id) {
    cashRegisterId = openSession.id;
  } else {
    cashRegisterId = requireId(
      postJson('/v1/cash-register/open', { openingAmount: 200 }, 'POST /v1/cash-register/open'),
      'abertura de caixa',
    );
  }

  return {
    authCookie,
    run: RUN,
    cashRegisterId,
    products: { paoFrances, paoDoce, bolo, refrigerante },
  };
}

// ---------------------------------------------------------------------------
// CARGA — o "dia a dia" da padaria (cada VU repete em loop)
// ---------------------------------------------------------------------------
export default function (data) {
  authCookie = data.authCookie;

  const { paoFrances, paoDoce, bolo, refrigerante } = data.products;

  // 1 + 2. Produção diária e confirmação ------------------------------------
  group('1. producao diaria', () => {
    const createRes = postJson(
      '/v1/daily-production',
      {
        productionDate: DATE_TO,
        items: [
          { productId: paoFrances, recipeMultiplier: randomInt(1, 3) },
          { productId: paoDoce, plannedQuantity: randomInt(20, 60) },
          { productId: bolo, plannedQuantity: randomInt(2, 5) },
        ],
      },
      'POST /v1/daily-production',
    );

    const created = check(createRes, {
      'producao: criada': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) return;

    sleep(1);

    const produceRes = patch(
      `/v1/daily-production/${createRes.json('id')}/produce-all`,
      'PATCH /v1/daily-production/:id/produce-all',
    );

    check(produceRes, {
      'producao: confirmada (produce-all)': (r) => r.status === 200,
    });
  });

  sleep(1);

  // 3. Vendas no PDV ----------------------------------------------------------
  group('2. vendas (pdv)', () => {
    const salesCount = randomInt(2, 4);

    for (let i = 0; i < salesCount; i++) {
      const paymentMethod = randomItem(['PIX', 'CARD', 'CASH']);

      const items = [
        { productId: paoFrances, weightInKg: randomItem([0.25, 0.5, 0.75, 1]) },
        { productId: paoDoce, quantity: randomInt(1, 4) },
      ];

      if (Math.random() < 0.5) items.push({ productId: refrigerante, quantity: randomInt(1, 2) });
      if (Math.random() < 0.2) items.push({ productId: bolo, quantity: 1 });

      const sale = { items, paymentMethod };

      // Dinheiro exige valor recebido >= total; 200 cobre qualquer carrinho acima.
      if (paymentMethod === 'CASH') sale.amountReceived = 200;

      const saleRes = postJson('/v1/sale', sale, 'POST /v1/sale');

      check(saleRes, {
        'venda: finalizada': (r) => r.status === 201 || r.status === 200,
      });

      sleep(0.5);
    }
  });

  // 4. Desperdício ------------------------------------------------------------
  group('3. desperdicio', () => {
    const wasteRes = postJson(
      '/v1/stock-movement/waste',
      {
        productId: randomItem([paoDoce, paoFrances]),
        quantity: 1,
        reasonDescription: 'Teste de carga — produto amassado',
      },
      'POST /v1/stock-movement/waste',
    );

    check(wasteRes, {
      'desperdicio: registrado': (r) => r.status === 201 || r.status === 200,
    });
  });

  sleep(1);

  // 5. Despesa ----------------------------------------------------------------
  group('4. despesa', () => {
    const expenseRes = postJson(
      '/v1/expense',
      {
        date: DATE_TO,
        value: randomInt(10, 300),
        description: randomItem(['Gás', 'Embalagens', 'Manutenção forno', 'Material de limpeza']),
      },
      'POST /v1/expense',
    );

    check(expenseRes, {
      'despesa: lançada': (r) => r.status === 201 || r.status === 200,
    });
  });

  sleep(1);

  // 6. Consultas (dono acompanhando o dia) ------------------------------------
  group('5. consultas e relatorios', () => {
    const reads = [
      ['/v1/dashboard/summary', 'GET /v1/dashboard/summary'],
      ['/v1/product', 'GET /v1/product'],
      ['/v1/sale', 'GET /v1/sale'],
      [`/v1/report/waste?${DATE_RANGE}`, 'GET /v1/report/waste'],
      [`/v1/report/production?${DATE_RANGE}`, 'GET /v1/report/production'],
      [`/v1/report/cash-register?${DATE_RANGE}`, 'GET /v1/report/cash-register'],
    ];

    for (const [path, name] of reads) {
      const res = getJson(path, name);
      check(res, { [`consulta: ${name} 200`]: (r) => r.status === 200 });
    }
  });

  sleep(1);
}

// ---------------------------------------------------------------------------
// TEARDOWN — fecha o caixa usado pelo teste (roda 1 vez, no fim)
// Fecha mesmo quando o caixa foi reaproveitado (já estava aberto): todas as
// vendas dele durante a carga vieram do teste, e assim o relatório de caixa
// fica com a sessão encerrada e nenhum caixa fica esquecido aberto.
// ---------------------------------------------------------------------------
export function teardown(data) {
  if (!data || !data.cashRegisterId) return;

  authCookie = data.authCookie;

  const closeRes = patch(
    `/v1/cash-register/${data.cashRegisterId}/close`,
    'PATCH /v1/cash-register/:id/close',
  );

  check(closeRes, { 'teardown: caixa fechado': (r) => r.status === 200 });
}
