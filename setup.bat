@echo off
REM Setup script to create necessary directories and copy .env files

echo Setting up directory structure for CMS development environment...

REM Create main directories
mkdir utils 2>nul
mkdir database\compose 2>nul
mkdir database\config\postgres\init 2>nul
mkdir database\data\postgres 2>nul
mkdir database\config\keydb 2>nul
mkdir database\data\keydb 2>nul
mkdir cms\compose 2>nul
mkdir cms\config\directus 2>nul
mkdir cms\data\directus\uploads 2>nul
mkdir cms\data\directus\extensions 2>nul
mkdir cms\data\directus\config 2>nul
mkdir observability\compose 2>nul
mkdir observability\config\prometheus 2>nul
mkdir observability\config\grafana\provisioning\datasources 2>nul
mkdir observability\config\grafana\provisioning\dashboards 2>nul
mkdir observability\config\grafana\dashboards 2>nul
mkdir observability\config\loki 2>nul
mkdir observability\config\promtail 2>nul
mkdir observability\data\prometheus 2>nul
mkdir observability\data\loki 2>nul
mkdir observability\data\grafana 2>nul
mkdir utilities\compose 2>nul
mkdir utilities\data\pgadmin 2>nul

REM Copy .env file to each component directory
echo Copying .env files to component directories...
copy .env database\ /y
copy .env cms\ /y
copy .env observability\ /y
copy .env utilities\ /y

echo Setup complete! You can now start each component independently.
echo For example: cd database && docker compose up -d
echo.
echo See README.md for more information.
