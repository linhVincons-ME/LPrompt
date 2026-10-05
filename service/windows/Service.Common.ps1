$ErrorActionPreference = 'Stop'
$script:LPromptServiceName = 'LPrompt'
$script:LPromptRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$script:LPromptRuntime = Join-Path $PSScriptRoot 'runtime'
$script:LPromptWinSw = Join-Path $script:LPromptRuntime 'LPromptService.exe'
$script:LPromptWinSwConfig = Join-Path $script:LPromptRuntime 'LPromptService.xml'
$script:LPromptHealthUrl = 'http://127.0.0.1:8484/health'

function Assert-LPromptWindows {
  if ($env:OS -ne 'Windows_NT') { throw 'Windows Service chỉ được hỗ trợ trên Windows.' }
}

function Assert-LPromptAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Hãy mở PowerShell bằng Run as administrator rồi chạy lại lệnh này.'
  }
}

function Get-LPromptService {
  Get-Service -Name $script:LPromptServiceName -ErrorAction SilentlyContinue
}

function Wait-LPromptServiceStatus {
  param(
    [Parameter(Mandatory)][ValidateSet('Running', 'Stopped')] [string]$Status,
    [int]$TimeoutSeconds = 30
  )
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  do {
    $service = Get-LPromptService
    if (-not $service) { throw 'LPrompt chưa được cài thành Windows Service.' }
    $service.Refresh()
    if ($service.Status.ToString() -eq $Status) { return $service }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  throw "Service không chuyển sang trạng thái $Status sau $TimeoutSeconds giây."
}

function Wait-LPromptHealth {
  param([int]$TimeoutSeconds = 20)
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  do {
    try {
      $health = Invoke-RestMethod -Uri $script:LPromptHealthUrl -TimeoutSec 2
      if ($health.status -eq 'ok' -and $health.lifecycle -eq 'ready') { return $health }
    } catch { }
    Start-Sleep -Milliseconds 500
  } while ([DateTime]::UtcNow -lt $deadline)
  throw "Service đã chạy nhưng health check không ready sau $TimeoutSeconds giây. Xem log tại service\windows\runtime\logs."
}

function ConvertTo-LPromptXmlText {
  param([Parameter(Mandatory)][string]$Value)
  return [Security.SecurityElement]::Escape($Value)
}
