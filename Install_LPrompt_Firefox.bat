@echo off
chcp 65001 >nul
title Cai dat LPrompt Extension cho Firefox

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install_LPrompt_Firefox.ps1"

pause
