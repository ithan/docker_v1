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
