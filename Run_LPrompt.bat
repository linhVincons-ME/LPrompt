@echo off
chcp 65001 >nul
title LPrompt Studio - AI Prompt Engineering IDE

echo ================================================================
echo   🚀 DANG KHOI DONG LPROMPT STUDIO...
echo ================================================================
echo.

cd /d "%~dp0"

:: Kiem tra node_modules
if not exist "node_modules\" (
    echo [1/3] Phat hien chua cai dat thu vien, dang chay npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [LOI] Khong the cai dat thu vien! Vui long kiem tra ket noi mang hoac Node.js.
        pause
        exit /b %errorlevel%
    )
)

echo [2/3] Dang mo trinh duyet tai http://localhost:5173 ...
start "" "http://localhost:5173"

echo [3/3] Dang khoi dong Dev Server...
echo.
echo ================================================================
echo   LPrompt Studio dang chay! Nhan Ctrl+C de dung ung dung.
echo   Trinh duyet se tu dong mo hoac truy cap: http://localhost:5173
echo ================================================================
echo.

call npm run dev

pause
