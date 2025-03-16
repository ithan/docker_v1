@echo off
setlocal enabledelayedexpansion

:: =========================================================
:: Database Services Startup Script (Windows)
:: =========================================================
:: This script:
:: 1. Creates a .env file with secure credentials if not present
:: 2. Checks if the required cms_network exists (DOES NOT create it)
:: 3. Starts all database services if network exists
:: =========================================================

echo [+] Database Services Startup Script
echo ====================================

:: Change to the script's directory
cd /d "%~dp0"

:: Check if .env file exists
if exist .env (
    echo [*] Found existing .env file - using existing credentials
) else (
    echo [*] Creating new .env file with secure credentials...
    
    :: Generate a UUID and hash it for secure passwords
    for /f "delims=" %%a in ('powershell -Command "[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() | ForEach-Object {$_.Replace('-','')}"') do set "BASE_PWD=%%a"
    
    :: Set variables with different sections of the UUID string
    set "POSTGRES_USER=directus"
    set "POSTGRES_PASSWORD=!BASE_PWD!"
    set "POSTGRES_DB=directus"
    
    set "PGPOOL_ADMIN_USER=admin"
    
    :: Generate second password using different PowerShell command
    for /f "delims=" %%a in ('powershell -Command "[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() | ForEach-Object {$_.Replace('-','')}"') do set "PGPOOL_ADMIN_PASSWORD=%%a"
    
    :: PgPool needs credentials to connect to PostgreSQL
    set "PGPOOL_POSTGRES_USERNAME=!POSTGRES_USER!"
    set "PGPOOL_POSTGRES_PASSWORD=!POSTGRES_PASSWORD!"
    
    :: KeyDB password (third password)
    for /f "delims=" %%a in ('powershell -Command "[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() | ForEach-Object {$_.Replace('-','')}"') do set "KEYDB_PASSWORD=%%a"
    
    :: Create the .env file
    echo # Auto-generated secure credentials by start-database.bat > .env
    echo # Generated on: %date% %time% >> .env
    echo. >> .env
    echo # PostgreSQL configuration >> .env
    echo POSTGRES_USER=!POSTGRES_USER! >> .env
    echo POSTGRES_PASSWORD=!POSTGRES_PASSWORD! >> .env
    echo POSTGRES_DB=!POSTGRES_DB! >> .env
    echo. >> .env
    echo # PgPool configuration >> .env
    echo PGPOOL_ADMIN_USER=!PGPOOL_ADMIN_USER! >> .env
    echo PGPOOL_ADMIN_PASSWORD=!PGPOOL_ADMIN_PASSWORD! >> .env
    echo PGPOOL_POSTGRES_USERNAME=!PGPOOL_POSTGRES_USERNAME! >> .env
    echo PGPOOL_POSTGRES_PASSWORD=!PGPOOL_POSTGRES_PASSWORD! >> .env
    echo. >> .env
    echo # KeyDB configuration >> .env
    echo KEYDB_PASSWORD=!KEYDB_PASSWORD! >> .env
    
    echo [+] Created .env file with secure credentials
)

:: Check if cms_network exists - DO NOT CREATE IT
echo [*] Checking if cms_network exists...
docker network inspect cms_network >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] ERROR: cms_network does not exist!
    echo [!] This network should be created by other core services.
    echo [!] Please make sure the core services are running before starting database services.
    echo [!] Aborting database startup.
    exit /b 1
) else (
    echo [+] Network cms_network exists - proceeding with service startup
)

:: Start database services
echo [*] Starting database services...
docker compose up -d

:: Check if services started successfully
if %ERRORLEVEL% equ 0 (
    echo [+] Database services started successfully!
    echo [+] PostgreSQL: localhost:5432
    echo [+] PgPool: localhost:5433
    echo [+] KeyDB: localhost:6379
) else (
    echo [!] Failed to start database services. Check logs with: docker compose logs
)

echo ====================================
echo [+] Done!