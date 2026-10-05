@echo off
chcp 65001 >nul
title LPrompt Studio Service v3.0

echo ================================================================
echo   KHỞI ĐỘNG LPROMPT LOCAL PROMPTOPS SERVICE (v3.0)
echo ================================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" call npm ci
if errorlevel 1 exit /b %errorlevel%
echo [1/3] Đang kiểm tra và đóng gói production...
call npm run build
if errorlevel 1 exit /b %errorlevel%

:: 2. Khởi chạy background service
echo [2/3] Đang khởi động LPrompt Service trên cổng 8484...
wscript.exe "%~dp0Start_LPrompt_Service.vbs"

:: 3. Mở trình duyệt Web Studio
echo [3/3] Đang mở trình duyệt tại: http://localhost:8484 ...
for /l %%i in (1,1,15) do (
  powershell -NoProfile -Command "try { if ((Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8484/health -TimeoutSec 1).StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
  if not errorlevel 1 goto ready
  timeout /t 1 >nul
)
echo [LOI] Service không phản hồi sau 15 giây.
exit /b 1
:ready
start "" "http://localhost:8484"

echo.
echo ================================================================
echo   LPrompt Studio Service v3.0 đã sẵn sàng!
echo   📍 Web Dashboard : http://localhost:8484
echo   📍 MCP Server RPC: http://localhost:8484/mcp
echo   🗄️ Database      : data\lprompt.db (Embedded SQLite)
echo ================================================================
echo.
timeout /t 5 >nul
exit /b 0
