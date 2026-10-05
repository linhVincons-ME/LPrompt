@echo off
chcp 65001 >nul
title LPrompt Studio Service v2.5

echo ================================================================
echo   🚀 KHỞI ĐỘNG LPROMPT LOCAL PROMPTOPS SERVICE (v2.5)
echo ================================================================
echo.

cd /d "%~dp0"

:: 1. Build production nếu chưa có dist
if not exist "dist\index.html" (
    echo [1/3] Đang đóng gói sản phẩm production...
    call npm run build
)

:: 2. Khởi chạy background service
echo [2/3] Đang khởi động LPrompt Service trên cổng 8484...
wscript.exe "%~dp0Start_LPrompt_Service.vbs"

:: 3. Mở trình duyệt Web Studio
echo [3/3] Đang mở trình duyệt tại: http://localhost:8484 ...
timeout /t 2 >nul
start "" "http://localhost:8484"

echo.
echo ================================================================
echo   ✅ LPrompt Studio Service v2.5 đã sẵn sàng!
echo   📍 Web Dashboard : http://localhost:8484
echo   📍 MCP Server RPC: http://localhost:8484/mcp
echo   🗄️ Database      : data\lprompt.db (Embedded SQLite)
echo ================================================================
echo.
timeout /t 5 >nul
exit /b 0
