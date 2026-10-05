[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
$service = Get-LPromptService
if (-not $service) {
  Write-Host 'LPrompt: Not installed' -ForegroundColor Yellow
  exit 2
}
$serviceInfo = Get-CimInstance -ClassName Win32_Service -Filter "Name='$script:LPromptServiceName'"
Write-Host "LPrompt service: $($service.Status); startup: $($serviceInfo.StartMode)"
try {
  $health = Invoke-RestMethod -Uri $script:LPromptHealthUrl -TimeoutSec 2
  Write-Host "Health: $($health.status); lifecycle: $($health.lifecycle); PID: $($health.pid); uptime: $($health.uptimeSeconds)s" -ForegroundColor Green
} catch {
  Write-Host 'Health endpoint không phản hồi.' -ForegroundColor Yellow
  if ($service.Status -eq 'Running') { exit 1 }
}
