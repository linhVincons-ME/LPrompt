[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator
$service = Get-LPromptService
if (-not $service) { throw 'LPrompt chưa được cài thành Windows Service.' }
if ($service.Status -ne 'Stopped') { Stop-Service -Name $script:LPromptServiceName }
Wait-LPromptServiceStatus -Status Stopped -TimeoutSeconds 30 | Out-Null
Write-Host 'LPrompt đã dừng an toàn.' -ForegroundColor Green
