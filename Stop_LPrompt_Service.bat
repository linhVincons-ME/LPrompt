@echo off
chcp 65001 >nul
echo ==============================================================
echo   Đang dừng LPrompt Background Service (Port 8484)...
echo ==============================================================

setlocal enabledelayedexpansion
set FOUND=0

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8484 ^| findstr LISTENING') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo [INFO] Phát hiện Process PID: !PID!, đang tiến hành tắt...
        taskkill /F /PID !PID! >nul 2>&1
        set FOUND=1
    )
)

if "!FOUND!"=="1" (
    echo [THÀNH CÔNG] Đã dừng LPrompt Service hoàn tất.
) else (
    echo [THÔNG BÁO] Không tìm thấy LPrompt Service đang chạy trên cổng 8484.
)

echo ==============================================================
timeout /t 3 >nul
exit /b 0
