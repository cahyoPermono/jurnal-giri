@echo off
REM Windows batch script to update HOST_IP in docker-compose.yml

echo 🔍 Detecting your current IP address...

REM Get IP address using ipconfig
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4.*192.168\|IPv4.*10\. \|IPv4.*172\."') do (
    set CURRENT_IP=%%i
    goto :found
)

:found
REM Remove leading space
set CURRENT_IP=%CURRENT_IP:~1%

if "%CURRENT_IP%"=="" (
    echo ❌ Could not detect IP address. Please check your network connection.
    echo.
    echo 💡 Manual workaround:
    echo    1. Run 'ipconfig' in Command Prompt
    echo    2. Find your IPv4 Address
    echo    3. Set environment variable: set HOST_IP=YOUR_IP_ADDRESS
    echo    4. Run: docker-compose up -d
    pause
    exit /b 1
)

echo ✅ Detected IP address: %CURRENT_IP%

echo 🔄 Updating docker-compose.yml with new HOST_IP...

REM Create backup
copy docker-compose.yml docker-compose.yml.backup >nul

REM Update using PowerShell
powershell -Command "$content = Get-Content 'docker-compose.yml' -Raw; $newContent = $content -replace 'HOST_IP: \"\$\{HOST_IP:-[^\"]*\}', \"HOST_IP: \"\$\{HOST_IP:-%CURRENT_IP}\"; Set-Content -Path 'docker-compose.yml' -Value $newContent"

if %errorlevel% equ 0 (
    echo ✅ Successfully updated HOST_IP to: %CURRENT_IP%
    echo.
    echo 🚀 To apply changes, run:
    echo    docker-compose down ^&^& docker-compose up --build -d
    echo.
    echo 🌐 Your application will be accessible at: http://%CURRENT_IP%:3000
    echo.
    echo 💡 Backup created: docker-compose.yml.backup
) else (
    echo ❌ Failed to update docker-compose.yml
    echo 💡 Restoring backup...
    move docker-compose.yml.backup docker-compose.yml >nul
    pause
    exit /b 1
)

echo.
echo Press any key to continue...
pause >nul
