[CmdletBinding()]
param([switch]$OpenBrowser)

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator
$service = Get-LPromptService
if (-not $service) { throw 'LPrompt chưa được cài thành Windows Service.' }
if ($service.Status -ne 'Stopped') {
  Stop-Service -Name $script:LPromptServiceName
  Wait-LPromptServiceStatus -Status Stopped -TimeoutSeconds 30 | Out-Null
}
Start-Service -Name $script:LPromptServiceName
Wait-LPromptServiceStatus -Status Running | Out-Null
$health = Wait-LPromptHealth
Write-Host "LPrompt đã restart và ready (PID $($health.pid))." -ForegroundColor Green
if ($OpenBrowser) { Start-Process 'http://127.0.0.1:8484' }
