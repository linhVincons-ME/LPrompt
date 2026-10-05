[CmdletBinding()]
param(
  [ValidateSet('Manual', 'Automatic')][string]$StartMode = 'Manual',
  [switch]$DelayedAutoStart,
  [switch]$StartAfterInstall,
  [string]$NodeExe,
  [string]$PythonExe,
  [string]$WinSwSource,
  [switch]$SkipBuild
)

. (Join-Path $PSScriptRoot 'Service.Common.ps1')
Assert-LPromptWindows
Assert-LPromptAdministrator

if (Get-LPromptService) { throw 'The LPrompt service already exists. Uninstall it before reinstalling.' }
if ($DelayedAutoStart -and $StartMode -ne 'Automatic') { throw 'DelayedAutoStart is valid only when StartMode is Automatic.' }

if (-not $NodeExe) {
  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { throw 'node.exe was not found. Install Node.js 24+ or pass -NodeExe.' }
  $NodeExe = $nodeCommand.Source
}
$NodeExe = [IO.Path]::GetFullPath($NodeExe)
if (-not (Test-Path -LiteralPath $NodeExe -PathType Leaf)) { throw "Node executable was not found: $NodeExe" }
$nodeVersionText = & $NodeExe --version
if ($LASTEXITCODE -ne 0) { throw 'Could not read the Node.js version.' }
if ($nodeVersionText -notmatch '^v(?<major>\d+)\.') { throw 'The Node.js version format is invalid.' }
if ([int]$Matches.major -lt 24) { throw "LPrompt requires Node.js 24+; current version is $nodeVersionText." }

Push-Location $script:LPromptRoot
try {
  if (-not $SkipBuild) {
    $npmCommand = Join-Path (Split-Path -Parent $NodeExe) 'npm.cmd'
    if (-not (Test-Path -LiteralPath $npmCommand -PathType Leaf)) { throw "npm.cmd was not found next to Node.js: $npmCommand" }
    if (-not (Test-Path -LiteralPath (Join-Path $script:LPromptRoot 'node_modules'))) {
      & $npmCommand ci
      if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    }
    & $npmCommand run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed; the service was not installed.' }
  }
} finally {
  Pop-Location
}

$distIndex = Join-Path $script:LPromptRoot 'dist\index.html'
if (-not (Test-Path -LiteralPath $distIndex -PathType Leaf)) { throw 'Missing dist\index.html. Build the application before installing the service.' }

$dataDir = Join-Path $script:LPromptRoot 'data'
$logDir = Join-Path $script:LPromptRuntime 'logs'
New-Item -ItemType Directory -Force -Path $script:LPromptRuntime, $dataDir, $logDir | Out-Null

$winSwVersion = '2.12.0'
$winSwUrl = "https://github.com/winsw/winsw/releases/download/v$winSwVersion/WinSW-x64.exe"
$winSwSha256 = '05B82D46AD331CC16BDC00DE5C6332C1EF818DF8CEEFCD49C726553209B3A0DA'
$downloadPath = Join-Path $script:LPromptRuntime 'LPromptService.download'
try {
  if ($WinSwSource) {
    $WinSwSource = [IO.Path]::GetFullPath($WinSwSource)
    if (-not (Test-Path -LiteralPath $WinSwSource -PathType Leaf)) { throw "WinSW source was not found: $WinSwSource" }
    Copy-Item -Force -LiteralPath $WinSwSource -Destination $downloadPath
  } else {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -UseBasicParsing -Uri $winSwUrl -OutFile $downloadPath
  }
  $actualHash = (Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash
  if ($actualHash -ne $winSwSha256) { throw "Invalid WinSW SHA-256. Expected $winSwSha256, received $actualHash." }
  Move-Item -Force -LiteralPath $downloadPath -Destination $script:LPromptWinSw
} finally {
  Remove-Item -Force -LiteralPath $downloadPath -ErrorAction SilentlyContinue
}

$templatePath = Join-Path $PSScriptRoot 'LPromptService.xml.template'
$xml = Get-Content -LiteralPath $templatePath -Raw
$delayedTag = if ($DelayedAutoStart) { '<delayedAutoStart>true</delayedAutoStart>' } else { '' }
$pythonTag = ''
if ($PythonExe) {
  $PythonExe = [IO.Path]::GetFullPath($PythonExe)
  if (-not (Test-Path -LiteralPath $PythonExe -PathType Leaf)) { throw "Python executable was not found: $PythonExe" }
  $pythonTag = '<env name="LPROMPT_PYTHON" value="{0}" />' -f (ConvertTo-LPromptXmlText $PythonExe)
}
$replacements = @{
  '{{NODE_EXE}}' = (ConvertTo-LPromptXmlText $NodeExe)
  '{{APP_ROOT}}' = (ConvertTo-LPromptXmlText $script:LPromptRoot)
  '{{DATA_DIR}}' = (ConvertTo-LPromptXmlText $dataDir)
  '{{LOG_DIR}}' = (ConvertTo-LPromptXmlText $logDir)
  '{{START_MODE}}' = $StartMode
  '{{DELAYED_AUTO_START}}' = $delayedTag
  '{{PYTHON_ENV}}' = $pythonTag
}
foreach ($token in $replacements.Keys) { $xml = $xml.Replace($token, $replacements[$token]) }
if ($xml -match '\{\{[^}]+\}\}') { throw 'The service config still contains an unreplaced token.' }
[xml]$validatedXml = $xml
[IO.File]::WriteAllText($script:LPromptWinSwConfig, $validatedXml.OuterXml, [Text.UTF8Encoding]::new($false))

$readTargets = @(
  $script:LPromptRoot,
  (Join-Path $script:LPromptRoot 'server'),
  (Join-Path $script:LPromptRoot 'dist'),
  (Join-Path $script:LPromptRoot 'node_modules'),
  (Join-Path $script:LPromptRoot 'python'),
  $script:LPromptRuntime
)
foreach ($readTarget in $readTargets) {
  if (-not (Test-Path -LiteralPath $readTarget)) { throw "Missing runtime path: $readTarget" }
  $isRecursiveDirectory = (Get-Item -LiteralPath $readTarget).PSIsContainer -and $readTarget -ne $script:LPromptRoot
  $recursiveArgs = if ($isRecursiveDirectory) { @('/T', '/C', '/Q') } else { @('/C', '/Q') }
  $permission = if ($isRecursiveDirectory) { '*S-1-5-19:(OI)(CI)RX' } else { '*S-1-5-19:(RX)' }
  & icacls.exe $readTarget /grant $permission @recursiveArgs | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not grant LocalService Read/Execute permission on: $readTarget" }
}
& icacls.exe $dataDir /grant '*S-1-5-19:(OI)(CI)M' /T /C /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not grant LocalService Modify permission on data.' }
& icacls.exe $logDir /grant '*S-1-5-19:(OI)(CI)M' /T /C /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not grant LocalService Modify permission on logs.' }

& $script:LPromptWinSw install
if ($LASTEXITCODE -ne 0) {
  $installExitCode = $LASTEXITCODE
  if (Get-LPromptService) { & $script:LPromptWinSw uninstall | Out-Null }
  throw "WinSW install failed with exit code $installExitCode; service registration rollback was attempted."
}

Write-Host "LPrompt Windows Service was installed ($StartMode, LocalService)." -ForegroundColor Green
if ($StartAfterInstall) {
  try {
    Start-Service -Name $script:LPromptServiceName
    Wait-LPromptServiceStatus -Status Running | Out-Null
    $health = Wait-LPromptHealth
    Write-Host "Service is ready at $script:LPromptHealthUrl (PID $($health.pid))." -ForegroundColor Green
  } catch {
    $installedService = Get-LPromptService
    if ($installedService -and $installedService.Status -ne 'Stopped') {
      Stop-Service -Name $script:LPromptServiceName -ErrorAction SilentlyContinue
    }
    throw "Service was installed but failed its health check and was stopped. $($_.Exception.Message)"
  }
} else {
  Write-Host 'Service is stopped. Use Start-LPromptService.ps1 or services.msc to start it.'
}
