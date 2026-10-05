[CmdletBinding()]
param([switch]$RemoveWrapper)

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator
$service = Get-LPromptService
if (-not $service) {
  Write-Host 'LPrompt Windows Service chưa được cài.' -ForegroundColor Yellow
  exit 0
}
if ($service.Status -ne 'Stopped') {
  Stop-Service -Name $script:LPromptServiceName
  Wait-LPromptServiceStatus -Status Stopped -TimeoutSeconds 30 | Out-Null
}
if (-not (Test-Path -LiteralPath $script:LPromptWinSw -PathType Leaf)) { throw "Thiếu WinSW wrapper: $script:LPromptWinSw" }
& $script:LPromptWinSw uninstall
if ($LASTEXITCODE -ne 0) { throw "WinSW uninstall thất bại với mã $LASTEXITCODE." }
$deadline = [DateTime]::UtcNow.AddSeconds(15)
while ((Get-LPromptService) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (Get-LPromptService) { throw 'Windows chưa xóa service sau 15 giây.' }
Write-Host 'Đã gỡ đăng ký LPrompt Windows Service. Data và log được giữ nguyên.' -ForegroundColor Green
if ($RemoveWrapper) {
  Remove-Item -Force -LiteralPath $script:LPromptWinSwConfig, $script:LPromptWinSw -ErrorAction SilentlyContinue
  Write-Host 'Đã xóa wrapper/config runtime; không xóa database hoặc log.'
}
