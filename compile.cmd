@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [ToggleAMP] Compiling ToggleAMP.exe...
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /out:ToggleAMP.exe /win32icon:ToggleAMP.ico /win32manifest:app.manifest src\AssemblyInfo.cs src\ToggleAMPApp.cs
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    exit /b 1
)

echo [ToggleAMP] Signing ToggleAMP.exe with Authenticode certificate...
powershell -ExecutionPolicy Bypass -Command "$c = Get-Item Cert:\CurrentUser\My\C3862BFAB5558E1DE4CE5A633FC2BF8BFD104FF5; if ($c) { $null = Set-AuthenticodeSignature -FilePath 'ToggleAMP.exe' -Certificate $c; Write-Host '[OK] Digitally signed ToggleAMP.exe successfully.' }"

echo [ToggleAMP] Build complete.
