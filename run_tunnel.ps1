# Radar BK — demo sidang sementara via Cloudflare Quick Tunnel.
# Usage: powershell -ExecutionPolicy Bypass -File run_tunnel.ps1 [-Port 5000] [-HostAddr 127.0.0.1]
param([int]$Port = 5000, [string]$HostAddr = "127.0.0.1")

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "cloudflared tak ketemu. Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
}

$job = Start-Job -ScriptBlock {
  param($dir, $h, $p)
  Set-Location -LiteralPath $dir
  & python -m bk_site.app --host $h --port $p
} -ArgumentList $PSScriptRoot, $HostAddr, $Port

try {
  $ok = $false
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $r = Invoke-WebRequest -Uri ("http://{0}:{1}/radar" -f $HostAddr, $Port) -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $ok) { throw "Flask tak sehat di ${HostAddr}:${Port} (30 dtk). Cek log job." }
  Write-Host ("Flask OK di http://{0}:{1}/ — mulai Quick Tunnel (Ctrl+C untuk stop)." -f $HostAddr, $Port)
  & cloudflared tunnel --url ("http://{0}:{1}" -f $HostAddr, $Port)
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  Write-Host "Tunnel stop. Flask job dibersihkan. Jangan share URL lagi."
}
