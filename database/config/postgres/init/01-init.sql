-- Install extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- Remove PostGIS as it's not available in the ankane/pgvector image
-- CREATE EXTENSION IF NOT EXISTS postgis;

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

-- Enable all required extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;
CREATE EXTENSION IF NOT EXISTS pg_visibility;
CREATE EXTENSION IF NOT EXISTS pgstattuple;
CREATE EXTENSION IF NOT EXISTS auto_explain;
CREATE EXTENSION IF NOT EXISTS pg_wait_sampling;

-- Configure pg_stat_statements if not already configured in postgresql.conf
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET track_activity_query_size = 4096;

-- Configure auto_explain if not already configured in postgresql.conf
ALTER SYSTEM SET auto_explain.log_min_duration = 500;
ALTER SYSTEM SET auto_explain.log_analyze = true;
ALTER SYSTEM SET auto_explain.log_buffers = true;
ALTER SYSTEM SET auto_explain.log_timing = true;
ALTER SYSTEM SET auto_explain.log_triggers = true;
ALTER SYSTEM SET auto_explain.log_verbose = true;
ALTER SYSTEM SET auto_explain.log_nested_statements = true;
