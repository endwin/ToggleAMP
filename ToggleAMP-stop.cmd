@echo off
title ToggleAMP - Stop All Services
cd /d "%~dp0"
if exist "bin\node\node.exe" (
    "bin\node\node.exe" ToggleAMP.js stop
) else (
    taskkill /F /IM nginx.exe /IM httpd.exe /IM php-cgi.exe /IM php.exe /IM mysqld.exe /IM mariadbd.exe /IM redis-server.exe /IM mailpit.exe >nul 2>&1
)
