@echo off
chcp 65001 >nul
net session >nul 2>&1
if errorlevel 1 goto elevate
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0service\windows\Start-LPromptService.ps1" -OpenBrowser
set "LPROMPT_EXIT=%errorlevel%"
if not "%LPROMPT_EXIT%"=="0" pause
exit /b %LPROMPT_EXIT%
:elevate
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b
