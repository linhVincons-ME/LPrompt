[CmdletBinding()]
param([switch]$RemoveWrapper)

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator
$service = Get-LPromptService
if (-not $service) {
  Write-Host 'LPrompt Windows Service is not installed.' -ForegroundColor Yellow
  exit 0
}
if ($service.Status -ne 'Stopped') {
  Stop-Service -Name $script:LPromptServiceName
  Wait-LPromptServiceStatus -Status Stopped -TimeoutSeconds 30 | Out-Null
}
if (-not (Test-Path -LiteralPath $script:LPromptWinSw -PathType Leaf)) { throw "Missing WinSW wrapper: $script:LPromptWinSw" }
& $script:LPromptWinSw uninstall
if ($LASTEXITCODE -ne 0) { throw "WinSW uninstall failed with exit code $LASTEXITCODE." }
$deadline = [DateTime]::UtcNow.AddSeconds(15)
while ((Get-LPromptService) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (Get-LPromptService) { throw 'Windows did not remove the service within 15 seconds.' }
Write-Host 'LPrompt Windows Service was unregistered. Data and logs were preserved.' -ForegroundColor Green
if ($RemoveWrapper) {
  Remove-Item -Force -LiteralPath $script:LPromptWinSwConfig, $script:LPromptWinSw -ErrorAction SilentlyContinue
  Write-Host 'Runtime wrapper and config were removed; database and logs were preserved.'
}
