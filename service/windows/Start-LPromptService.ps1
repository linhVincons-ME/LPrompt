[CmdletBinding()]
param([switch]$OpenBrowser)

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator
$service = Get-LPromptService
if (-not $service) { throw 'LPrompt is not installed. Run Install-LPromptService.ps1 first.' }
if ($service.Status -ne 'Running') { Start-Service -Name $script:LPromptServiceName }
Wait-LPromptServiceStatus -Status Running | Out-Null
$health = Wait-LPromptHealth
Write-Host "LPrompt is ready at http://127.0.0.1:8484 (PID $($health.pid))." -ForegroundColor Green
if ($OpenBrowser) { Start-Process 'http://127.0.0.1:8484' }
