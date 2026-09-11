@echo off
setlocal
cd /d "%~dp0"
echo [ToggleAMP] Creating Desktop Shortcut with new icon...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=New-Object -ComObject WScript.Shell;$d=[Environment]::GetFolderPath('Desktop');$s=$w.CreateShortcut($d+'\ToggleAMP.lnk');$s.TargetPath=(Get-Location).Path+'\ToggleAMP.exe';$s.WorkingDirectory=(Get-Location).Path;$s.IconLocation=(Get-Location).Path+'\ToggleAMP.ico,0';$s.Description='ToggleAMP - Multi-Stack Local Dev';$s.Save();Write-Host '[OK] Desktop shortcut created at:' $s.FullName"
echo.
pause
