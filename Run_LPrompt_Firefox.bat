@echo off
chcp 65001 >nul
title Khoi dong LPrompt tren Mozilla Firefox

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run_LPrompt_Firefox.ps1"

pause
