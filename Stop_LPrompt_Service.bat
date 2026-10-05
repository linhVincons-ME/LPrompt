@echo off
chcp 65001 >nul
echo ==============================================================
echo   Đang dừng LPrompt Background Service (Port 8484)...
echo ==============================================================

if not exist "%~dp0data\lprompt.pid" goto notfound
set /p LPROMPT_PID=<"%~dp0data\lprompt.pid"
powershell -NoProfile -Command "$p=Get-Process -Id %LPROMPT_PID% -ErrorAction SilentlyContinue; if (-not $p) { exit 2 }; if ($p.Path -notmatch 'node(.exe)?$') { exit 3 }; Stop-Process -Id %LPROMPT_PID% -Force"
if errorlevel 1 goto unsafe
del /q "%~dp0data\lprompt.pid" 2>nul
echo [THÀNH CÔNG] Đã dừng đúng tiến trình LPrompt PID %LPROMPT_PID%.
goto done
:unsafe
echo [LOI] PID file không trỏ tới tiến trình Node hợp lệ; không dừng tiến trình.
exit /b 1
:notfound
echo [THÔNG BÁO] Không có PID file của LPrompt Service.
:done

echo ==============================================================
timeout /t 3 >nul
exit /b 0
