-- This script initializes the PostgreSQL instance with necessary extensions and configurations

-- Install extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create monitoring user
CREATE USER postgres_exporter WITH PASSWORD 'password';
ALTER USER postgres_exporter SET SEARCH_PATH TO postgres_exporter,pg_catalog;

-- Grant permissions for monitoring
GRANT pg_monitor TO postgres_exporter;
GRANT SELECT ON pg_stat_database TO postgres_exporter;
GRANT SELECT ON pg_stat_statements TO postgres_exporter;

-- Create directus user and database if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'directus') THEN
    CREATE USER directus WITH PASSWORD 'directus';
  END IF;
 
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'directus') THEN
    CREATE DATABASE directus WITH OWNER directus;
  END IF;
END
$$;

-- Grant privileges to directus user
GRANT ALL PRIVILEGES ON DATABASE directus TO directus;

-- Connect to the directus database to enable extensions there
\c directus

-- Enable all required extensions in the directus database
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;
CREATE EXTENSION IF NOT EXISTS pg_visibility;
CREATE EXTENSION IF NOT EXISTS pgstattuple;
CREATE EXTENSION IF NOT EXISTS pg_wait_sampling;
CREATE EXTENSION IF NOT EXISTS pgpool_adm;
-- Note: auto_explain is a module that needs to be loaded via shared_preload_libraries,
-- not as an extension. It's now configured in the Dockerfile.