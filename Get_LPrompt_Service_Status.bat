@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0service\windows\Get-LPromptServiceStatus.ps1"
set "LPROMPT_EXIT=%errorlevel%"
if not "%LPROMPT_EXIT%"=="0" pause
exit /b %LPROMPT_EXIT%
