#!/usr/bin/env bash
# Roda NO SERVIDOR (onde o Docker do bakers_api_container está), ao lado do
# container, durante a janela do teste de carga. Grava CPU% e memória usada
# num CSV pra depois plotar o gráfico no chart-viewer.html.
#
# Uso:
#   ./monitor-docker-stats.sh [container] [intervalo_segundos] [arquivo_saida.csv]
#
# Exemplo (padrão, roda até você apertar Ctrl+C):
#   ./monitor-docker-stats.sh
#
# Exemplo (nome de container diferente, amostra a cada 2s, salva em outro arquivo):
#   ./monitor-docker-stats.sh bakers_api_container 2 stats-teste-1.csv

set -euo pipefail

CONTAINER="${1:-bakers_api_container}"
INTERVAL="${2:-1}"
OUTPUT="${3:-load-test-stats-$(date +%Y%m%d-%H%M%S).csv}"

echo "Monitorando container '$CONTAINER' a cada ${INTERVAL}s -> $OUTPUT"
echo "Pressione Ctrl+C para parar."

echo "timestamp,cpu_percent,mem_used_mb,mem_limit_mb" > "$OUTPUT"

# Converte "12.34MiB" / "1.2GiB" pra megabytes (número puro).
to_mb() {
  local raw="$1"
  local value unit

  value=$(echo "$raw" | sed -E 's/([0-9.]+).*/\1/')
  unit=$(echo "$raw" | sed -E 's/[0-9.]+//')

  case "$unit" in
    GiB) echo "$value * 1024" | bc ;;
    MiB) echo "$value" ;;
    KiB) echo "$value / 1024" | bc ;;
    *) echo "$value" ;;
  esac
}

while true; do
  timestamp=$(date +%Y-%m-%dT%H:%M:%S)

  stats=$(docker stats "$CONTAINER" --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}")
  cpu_raw=$(echo "$stats" | cut -d'|' -f1 | tr -d '%')
  mem_raw=$(echo "$stats" | cut -d'|' -f2)
  mem_used_raw=$(echo "$mem_raw" | cut -d'/' -f1 | xargs)
  mem_limit_raw=$(echo "$mem_raw" | cut -d'/' -f2 | xargs)

  mem_used_mb=$(to_mb "$mem_used_raw")
  mem_limit_mb=$(to_mb "$mem_limit_raw")

  echo "${timestamp},${cpu_raw},${mem_used_mb},${mem_limit_mb}" >> "$OUTPUT"

  sleep "$INTERVAL"
done
