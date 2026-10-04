# Equivalente local (Windows) do monitor-docker-stats.sh: em vez de ler o
# `docker stats` de um container, mede um processo específico (a API Node
# rodando fora do Docker) pelo PID. Assim o gráfico reflete só a API, e não
# os outros programas abertos na máquina.
#
# Grava o mesmo formato de CSV do monitor-docker-stats.sh, então o
# chart-viewer.html lê sem nenhuma mudança.
#
# CPU (%) segue a mesma convenção do `docker stats`: 100% = 1 núcleo inteiro
# (pode passar de 100% em máquinas com vários núcleos).
# Memória = working set do processo; mem_limit_mb = RAM física total.
#
# Uso:
#   .\monitor-process-stats.ps1 -ProcessId <pid> [-IntervalSeconds 1] [-Output arquivo.csv]
#
# Descobrir o PID da API escutando na porta 3334:
#   (Get-NetTCPConnection -LocalPort 3334 -State Listen).OwningProcess

param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [double]$IntervalSeconds = 1,
  [string]$Output = "load-test-stats-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
)

$ErrorActionPreference = 'Stop'

$memLimitMb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB, 2)
$culture = [System.Globalization.CultureInfo]::InvariantCulture

Write-Host "Monitorando processo $ProcessId a cada ${IntervalSeconds}s -> $Output"
Write-Host "Pressione Ctrl+C para parar."

'timestamp,cpu_percent,mem_used_mb,mem_limit_mb' | Out-File -FilePath $Output -Encoding ascii

$process = Get-Process -Id $ProcessId
$lastCpu = $process.TotalProcessorTime.TotalMilliseconds
$lastWall = [Diagnostics.Stopwatch]::StartNew()

while ($true) {
  Start-Sleep -Milliseconds ([int]($IntervalSeconds * 1000))

  $process.Refresh()
  if ($process.HasExited) {
    Write-Host 'Processo encerrado, parando o monitoramento.'
    break
  }

  $cpuNow = $process.TotalProcessorTime.TotalMilliseconds
  $wallMs = $lastWall.Elapsed.TotalMilliseconds
  $lastWall.Restart()

  $cpuPercent = [math]::Round((($cpuNow - $lastCpu) / $wallMs) * 100, 2)
  $lastCpu = $cpuNow

  $memUsedMb = [math]::Round($process.WorkingSet64 / 1MB, 2)
  $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

  $line = '{0},{1},{2},{3}' -f $timestamp,
    $cpuPercent.ToString($culture),
    $memUsedMb.ToString($culture),
    $memLimitMb.ToString($culture)

  $line | Out-File -FilePath $Output -Encoding ascii -Append
}
