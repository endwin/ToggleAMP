@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ToggleAMP Server - Console

rem 1. Locate Node.js binary (Digitally Signed by Node.js Foundation - SAC Trusted)
set "NODE_EXE=%~dp0bin\node\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

rem 2. Locate main script
set "JS_FILE=%~dp0ToggleAMP.js"
if not exist "%JS_FILE%" set "JS_FILE=%~dp0end-server.js"

if not exist "%JS_FILE%" goto no_js_file

rem 3. Pre-check syntax of JS script
"%NODE_EXE%" -c "%JS_FILE%" >nul 2>&1
if %errorlevel% neq 0 goto syntax_error

rem 4. If argument is provided, dispatch accordingly
if "%~1"=="" goto run_server
if /i "%~1"=="terminal" goto open_terminal
if /i "%~1"=="gui" goto run_server
if /i "%~1"=="server" goto run_server
if /i "%~1"=="logs" goto run_logs
if /i "%~1"=="log" goto run_logs
if /i "%~1"=="app" goto run_app

rem Run CLI command with arguments
"%NODE_EXE%" "%JS_FILE%" %*
set "CMD_EXIT_CODE=%errorlevel%"
if %CMD_EXIT_CODE% neq 0 goto error_exit
goto end

:run_server
rem Set active paths for development
set "PHP_BIN=%~dp0bin\php\php-8.4"
if not exist "%PHP_BIN%\php.exe" (
    for /d %%D in ("%~dp0bin\php\php-*") do (
        if exist "%%D\php.exe" set "PHP_BIN=%%D"
    )
)
set "DB_BIN=%~dp0bin\db\mariadb-11.4\bin"
if not exist "%DB_BIN%\mysql.exe" (
    for /d %%D in ("%~dp0bin\db\*") do (
        if exist "%%D\bin\mysql.exe" set "DB_BIN=%%D\bin"
        if exist "%%D\mysql.exe" set "DB_BIN=%%D"
    )
)
set "PATH=%PHP_BIN%;%DB_BIN%;%~dp0bin\node;%~dp0bin\apache\bin;%~dp0bin\nginx;%~dp0bin\mailpit;%PATH%"
cls
echo ======================================================================
echo   ToggleAMP v1.3.0 - Control Center ^& Live Console
echo ======================================================================
echo   [OK] 스마트 앱 컨트롤(Smart App Control) 안전 호환 모드로 가동
echo   [OK] 공인 디지털 서명된 Node.js 런타임을 통해 안전하게 실행됩니다.
echo   [*] 웹 대시보드:  http://localhost:4000 (자동 실행)
echo   [*] 작업 폴더:    %~dp0
echo   [*] 실시간 로그:  아래 콘솔 및 웹 대시보드에서 동시 스트리밍
echo ======================================================================
echo   [안내]
echo   * 이 콘솔 창을 닫으면 ToggleAMP 서버가 종료됩니다. (화면 유지)
echo   * 서버를 중지하려면 Ctrl+C 를 누르세요.
echo ======================================================================
echo.
"%NODE_EXE%" "%JS_FILE%" gui
set "CMD_EXIT_CODE=%errorlevel%"
echo.
echo ======================================================================
echo   ToggleAMP 세션이 종료되었습니다. (화면 유지 중)
echo   아무 키나 누르면 창을 닫습니다...
echo ======================================================================
pause >nul
goto end

:open_terminal
set "PHP_BIN=%~dp0bin\php\php-8.4"
if not exist "%PHP_BIN%\php.exe" (
    for /d %%D in ("%~dp0bin\php\php-*") do (
        if exist "%%D\php.exe" set "PHP_BIN=%%D"
    )
)
set "DB_BIN=%~dp0bin\db\mariadb-11.4\bin"
if not exist "%DB_BIN%\mysql.exe" (
    for /d %%D in ("%~dp0bin\db\*") do (
        if exist "%%D\bin\mysql.exe" set "DB_BIN=%%D\bin"
        if exist "%%D\mysql.exe" set "DB_BIN=%%D"
    )
)
set "PATH=%PHP_BIN%;%DB_BIN%;%~dp0bin\node;%~dp0bin\apache\bin;%~dp0bin\nginx;%~dp0bin\mailpit;%PATH%"
cls
echo ======================================================================
echo   ToggleAMP v1.3.0 - Developer Terminal
echo ======================================================================
echo   [OK] 일반 사용자 권한으로 안전하게 가동 중 (관리자 권한 불필요)
echo   [*] PHP / DB / 웹서버 환경변수(PATH) 자동 등록 완료
echo   * 이 창에서 직접 개발 명령어를 입력할 수 있습니다. (화면 유지)
echo ======================================================================
echo.
cmd.exe /k "prompt [ToggleAMP] $P$G"
goto prompt_exit

:run_logs
cls
"%NODE_EXE%" "%JS_FILE%" logs
echo.
pause
goto end

:run_app
if exist "%~dp0ToggleAMP.exe" (
    start "" "%~dp0ToggleAMP.exe"
) else (
    echo ToggleAMP.exe를 찾을 수 없습니다.
)
goto end

:prompt_exit
echo.
echo ======================================================================
echo ToggleAMP 개발자 콘솔이 종료되었습니다. 화면 유지 중
echo 아무 키나 누르면 창을 닫습니다...
echo ======================================================================
pause >nul
goto end

:syntax_error
cls
echo.
echo ======================================================================
echo [오류] ToggleAMP.js 파일에 문법 오류(Syntax Error)가 감지되었습니다!
echo ======================================================================
echo.
"%NODE_EXE%" -c "%JS_FILE%"
echo.
echo ======================================================================
echo 파일 수정 중 문법 오류가 발생했습니다. 확인 후 수정해 주십시오. (화면 유지)
echo ======================================================================
echo.
pause
exit /b 1

:no_js_file
cls
echo ======================================================================
echo [오류] ToggleAMP.js 파일을 찾을 수 없습니다: %JS_FILE%
echo ======================================================================
echo.
pause
exit /b 1

:error_exit
echo.
echo ======================================================================
echo [알림] 명령 실행이 완료되었습니다. 종료 코드: %CMD_EXIT_CODE%
echo ======================================================================
echo.
pause

:end
