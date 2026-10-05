@echo off
chcp 65001 >nul
title LPrompt Studio - Background Service Console (v2.5)

echo ==============================================================
echo   Khởi động LPrompt Service trong cửa sổ Console (Debug Mode)
echo ==============================================================

cd /d "%~dp0"
node server/index.js

pause
