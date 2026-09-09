@echo off
:: ToggleAMP Windows Hosts File Synchronizer (with Auto-Elevation)
setlocal EnableDelayedExpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ToggleAMP] Requesting Administrator privileges to update hosts file...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   ToggleAMP Windows Hosts Synchronizer
echo ========================================================
echo.

cd /d "%~dp0\.."
if exist "bin\node\node.exe" (
    "bin\node\node.exe" ToggleAMP.js vhost
) else (
    node ToggleAMP.js vhost
)

echo.
echo [ToggleAMP] Hosts file successfully updated!
echo You can now access all *.test domains in your browser.
echo.
pause
