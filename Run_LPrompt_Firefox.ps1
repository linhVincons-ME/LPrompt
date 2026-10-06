#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  [LPrompt] KHOI DONG EXTENSION TREN MOZILLA FIREFOX" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build extension-dist-firefox
Write-Host "[1/2] Dang kiem tra va bien dich ban build Firefox..." -ForegroundColor Yellow
& npm run build:extension:firefox
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LOI] Khong the build extension cho Firefox." -ForegroundColor Red
    exit 1
}

$firefoxDist = Join-Path $scriptDir "extension-dist-firefox"
$firefoxProfile = Join-Path $scriptDir "data\firefox-profile"
if (-not (Test-Path -LiteralPath $firefoxProfile)) {
    New-Item -ItemType Directory -Path $firefoxProfile -Force | Out-Null
}

$firefoxPaths = @(
    "C:\Program Files\Mozilla Firefox\firefox.exe",
    "C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
    "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
)
$firefoxExe = $firefoxPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

Write-Host "[2/2] Dang khoi chay Firefox voi extension LPrompt..." -ForegroundColor Yellow
Write-Host "Firefox se tu dong mo https://gemini.google.com voi LPrompt da duoc nap san." -ForegroundColor Green
Write-Host "Du lieu profile duoc luu ben vung tai: data\firefox-profile" -ForegroundColor Gray
Write-Host ""

$firefoxArgs = @(
    "run",
    "--source-dir", $firefoxDist,
    "--url", "https://gemini.google.com",
    "--firefox-profile", $firefoxProfile,
    "--profile-create-if-missing",
    "--keep-profile-changes",
    "--no-reload",
    "--no-input"
)

if ($firefoxExe) {
    $firefoxArgs += @("--firefox", $firefoxExe)
}

& npx --yes web-ext @firefoxArgs
