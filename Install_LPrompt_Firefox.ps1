#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  [LPrompt] CAI DAT EXTENSION CHO MOZILLA FIREFOX" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build extension-dist-firefox
Write-Host "[1/4] Dang bien dich extension danh rieng cho Firefox..." -ForegroundColor Yellow
& npm run build:extension:firefox
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LOI] Bien dich extension that bai!" -ForegroundColor Red
    exit 1
}

# 2. Tao file package xpi
Write-Host "[2/4] Dang tao file dong goi extension lprompt.xpi..." -ForegroundColor Yellow
$firefoxDist = Join-Path $scriptDir "extension-dist-firefox"
$zipPath = Join-Path $firefoxDist "lprompt.zip"
$xpiPath = Join-Path $firefoxDist "lprompt.xpi"
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
if (Test-Path -LiteralPath $xpiPath) { Remove-Item -LiteralPath $xpiPath -Force }
$distFiles = Get-ChildItem -LiteralPath $firefoxDist | Where-Object { $_.Name -ne "lprompt.zip" -and $_.Name -ne "lprompt.xpi" }
Compress-Archive -Path $distFiles.FullName -DestinationPath $zipPath -Force
Copy-Item -LiteralPath $zipPath -Destination $xpiPath -Force

# 3. Tim trinh duyet Firefox
Write-Host "[3/4] Dang kiem tra Mozilla Firefox tren may tinh..." -ForegroundColor Yellow
$firefoxPaths = @(
    "C:\Program Files\Mozilla Firefox\firefox.exe",
    "C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
    "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
)
$firefoxExe = $firefoxPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $firefoxExe) {
    Write-Host "[CANH BAO] Khong tim thay firefox.exe o vi tri mac dinh." -ForegroundColor Yellow
}

# 4. Copy duong dan manifest vao Clipboard va mo trang cai dat
$manifestPath = Join-Path $firefoxDist "manifest.json"
try {
    Set-Clipboard -Value $manifestPath
    Write-Host "[4/4] Da copy duong dan manifest vao Clipboard: $manifestPath" -ForegroundColor Green
} catch {
    Write-Host "[4/4] Duong dan manifest: $manifestPath" -ForegroundColor Gray
}

# Mo Explorer chon san manifest.json
Start-Process explorer.exe -ArgumentList "/select,`"$manifestPath`""

if ($firefoxExe) {
    Write-Host "Dang mo trang quan ly Add-on cua Firefox..." -ForegroundColor Cyan
    Start-Process $firefoxExe -ArgumentList "about:debugging#/runtime/this-firefox"
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  [OK] HOAN TAT CHUAN BI CAI DAT CHO FIREFOX!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Cac buoc tiep theo trong cua so Firefox vua mo:" -ForegroundColor White
Write-Host "1. Nhan vao nut 'This Firefox' o menu ben trai." -ForegroundColor White
Write-Host "2. Nhan vao nut 'Load Temporary Add-on...' (Tai tien ich tam thoi...)" -ForegroundColor White
Write-Host "3. Dan duong dan da copy hoac chon file manifest.json vua duoc mo trong Explorer." -ForegroundColor White
Write-Host "4. Mo trang https://gemini.google.com va bat Sidebar (hoac bieu tuong LPrompt) de su dung!" -ForegroundColor White
Write-Host ""
Write-Host "Meo: Neu muon tu dong khoi dong Firefox voi extension da cai san moi luc," -ForegroundColor Cyan
Write-Host "ban chi can chay file: Run_LPrompt_Firefox.bat" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Green
