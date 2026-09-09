// Lê coverage/coverage-summary.json (gerado pelo reporter "json-summary" do
// Jest) e agrega o percentual de cobertura por camada da Clean Architecture
// (domain / application / infra), pra usar no apêndice do TCC.
//
// Uso: node scripts/coverage-by-layer.js
// (rodar depois de `pnpm test:cov:report`, que já chama este script)
//
// Saída principal: coverage/coverage-by-layer.csv — abra no Excel/Google
// Sheets e formate a tabela do jeito que quiser pro apêndice. O separador é
// ";" (padrão do Excel em pt-BR), então abrir com duplo clique já separa as
// colunas sozinho, sem precisar de "Dados > Texto para colunas".

const fs = require('fs');
const path = require('path');

const COVERAGE_SUMMARY_PATH = path.join(
  __dirname,
  '..',
  'coverage',
  'coverage-summary.json',
);
const CSV_OUTPUT_PATH = path.join(__dirname, '..', 'coverage', 'coverage-by-layer.csv');
const MD_OUTPUT_PATH = path.join(__dirname, '..', 'coverage', 'coverage-by-layer.md');

const LAYER_ORDER = ['domain', 'application', 'infra', 'outros'];

const LAYER_LABEL = {
  domain: 'Domain',
  application: 'Application',
  infra: 'Infra',
  outros: 'Outros (fora de domain/application/infra)',
};

function detectLayer(filePath) {
  const normalized = filePath.replace(/\\/g, '/');

  if (/\/domain\//.test(normalized)) return 'domain';
  if (/\/application\//.test(normalized)) return 'application';
  if (/\/infra\//.test(normalized)) return 'infra';

  return 'outros';
}

function buildRows(summary) {
  const byLayer = {
    domain: { files: 0, covered: 0, total: 0 },
    application: { files: 0, covered: 0, total: 0 },
    infra: { files: 0, covered: 0, total: 0 },
    outros: { files: 0, covered: 0, total: 0 },
  };

  for (const [filePath, metrics] of Object.entries(summary)) {
    if (filePath === 'total') continue;

    const layer = detectLayer(filePath);
    byLayer[layer].files += 1;
    byLayer[layer].covered += metrics.statements.covered;
    byLayer[layer].total += metrics.statements.total;
  }

  return LAYER_ORDER.map((layer) => {
    const { files, covered, total } = byLayer[layer];
    const pct = total === 0 ? 0 : (covered / total) * 100;
    return { layer, label: LAYER_LABEL[layer], files, covered, total, pct };
  });
}

function toCsv(rows, totals) {
  const header = ['Camada', 'Arquivos', 'Statements cobertos', 'Statements totais', 'Cobertura (%)'];
  const lines = [header.join(';')];

  for (const r of rows) {
    lines.push([r.label, r.files, r.covered, r.total, r.pct.toFixed(2)].join(';'));
  }

  lines.push(['Total', totals.files, totals.covered, totals.total, totals.pct.toFixed(2)].join(';'));

  // BOM no início — sem isso o Excel em pt-BR mostra acentos quebrados.
  return '﻿' + lines.join('\r\n') + '\r\n';
}

function toMarkdown(rows, totals) {
  const lines = [
    '# Cobertura de testes por camada',
    '',
    '| Camada | Arquivos | Statements cobertos | Statements totais | Cobertura |',
    '|---|---|---|---|---|',
    ...rows.map(
      (r) => `| ${r.label} | ${r.files} | ${r.covered} | ${r.total} | ${r.pct.toFixed(2)}% |`,
    ),
    `| **Total** | ${totals.files} | ${totals.covered} | ${totals.total} | ${totals.pct.toFixed(2)}% |`,
    '',
  ];

  return lines.join('\n');
}

// Alinha as colunas da tabela Markdown (larguras fixas, como um editor
// bonitinho faria). O prettier é ESM-only (v3), por isso o import dinâmico.
// coverage/ está no .gitignore, então rodar o prettier via CLI simplesmente
// ignora o arquivo — passar pela API evita esse problema.
async function formatMarkdown(text) {
  try {
    const prettier = await import('prettier');
    return await prettier.format(text, { parser: 'markdown' });
  } catch (error) {
    console.warn('Não foi possível formatar o Markdown com prettier:', error.message);
    return text;
  }
}

async function main() {
  if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
    console.error(
      `Arquivo não encontrado: ${COVERAGE_SUMMARY_PATH}\n` +
        'Rode "pnpm test:cov:report" (ou garanta que o reporter "json-summary" está habilitado no jest).',
    );
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf-8'));
  const rows = buildRows(summary);

  const totals = {
    files: rows.reduce((acc, r) => acc + r.files, 0),
    covered: rows.reduce((acc, r) => acc + r.covered, 0),
    total: rows.reduce((acc, r) => acc + r.total, 0),
  };
  totals.pct = totals.total === 0 ? 0 : (totals.covered / totals.total) * 100;

  const markdown = await formatMarkdown(toMarkdown(rows, totals));

  fs.writeFileSync(CSV_OUTPUT_PATH, toCsv(rows, totals), 'utf-8');
  fs.writeFileSync(MD_OUTPUT_PATH, markdown, 'utf-8');

  console.log('\n' + markdown);
  console.log(`Planilha (abra no Excel/Sheets): ${CSV_OUTPUT_PATH}`);
  console.log(`Markdown (colunas alinhadas):     ${MD_OUTPUT_PATH}`);
}

main();
