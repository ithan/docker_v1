# CMS Development Environment with Full Observability

This setup provides a complete development environment for Directus CMS with a full observability stack. Each component can be started independently as needed.

## Project Structure

```
cms\                            # CMS services
├── compose\                    # Service compositions  
│   └── directus.yaml           # Directus container configuration
├── config\                     # Configuration files
│   └── directus\               # Directus configs
│       └── .env                # Directus environment variables
├── .gitignore
└── docker-compose.yml          # CMS compose file

database\                       # Database services
├── compose\                    # Individual service compositions
│   ├── keydb.yaml              # KeyDB cache service configuration
│   ├── pgpool.yaml             # PgPool connection pooler configuration
│   └── postgresql.yaml         # PostgreSQL service configuration
├── config\                     # Configuration files
│   ├── keydb\                  # KeyDB configuration
│   │   └── keydb.conf          # KeyDB server configuration
│   ├── pgpool\                 # PgPool configuration
│   │   └── pgpool.conf         # PgPool server configuration  
│   └── postgres\               # PostgreSQL configuration
│       ├── init\               # Initialization scripts
│       │   └── 01-init.sql     # Database setup SQL script
│       ├── pg_hba.conf         # PostgreSQL access control
│       └── postgresql.conf     # PostgreSQL server configuration
├── docker\                     # Custom Docker images
│   ├── pgpool\                 # PgPool image
│   │   └── Dockerfile          # PgPool container definition
│   └── postgres\               # PostgreSQL image
│       ├── auto_explain.conf   # Query explain configuration
│       └── Dockerfile          # PostgreSQL container definition
├── .env                        # Database environment variables
├── .gitignore
├── docker-compose.yml          # Database compose file
├── start-database.bat          # Database startup script
└── test-cache.ts               # PgPool cache testing script

modules\                        # Alternative module configurations
├── cms\                        # Alternative CMS configuration
│   └── compose\                # CMS compose files
│       └── directus.yaml       # Directus container configuration
└── database\                   # Alternative database configuration
    └── compose\                # Database compose files
        ├── cache.yaml          # Cache service configuration
        └── database.yaml       # Database service configuration

observability\                  # Monitoring stack
├── compose\                    # Individual monitoring service compositions
│   ├── exporters.yaml          # Metrics exporters configuration
│   ├── grafana.yaml            # Grafana configuration
│   ├── loki.yaml               # Loki log aggregation configuration
│   └── prometheus.yaml         # Prometheus configuration
├── config\                     # Configuration files
│   ├── grafana\                # Grafana configuration
│   │   ├── dashboards\         # Dashboard JSON files
│   │   └── provisioning\       # Grafana provisioning
│   │       ├── dashboards\     # Dashboards configuration
│   │       │   └── dashboards.yaml 
│   │       └── datasources\    # Data sources configuration
│   │           └── datasources.yaml
│   ├── loki\                   # Loki configuration
│   │   └── loki-config.yaml    # Loki server config
│   ├── prometheus\             # Prometheus configuration
│   │   └── prometheus.yml      # Prometheus server config
│   └── promtail\               # Promtail (log collector) configuration
│       └── promtail-config.yaml # Promtail agent config
├── .gitignore
└── docker-compose.yml          # Observability compose file

utilities\                      # Development tools
├── compose\                    # Individual utility service compositions
│   ├── mailhog.yaml            # MailHog email testing service
│   └── pgadmin.yaml            # PgAdmin database admin interface
├── config\                     # Configuration files
├── .gitignore
└── docker-compose.yml          # Utilities compose file

utils\                          # Shared utility configurations
├── healthchecks.yml            # Common healthcheck definitions
└── logging.yml                 # Shared logging configuration

.env                            # Root environment variables
.gitignore                      # Root gitignore file
docker-compose.yml              # Root compose file (network setup)
README.md                       # This documentation file
```

## Database Architecture

The system uses a multi-tier database approach for optimal performance and maintainability:

### PostgreSQL (Primary Database)

- Custom-built image with production-grade configuration
- Includes vector search support via the `vector` extension
- Advanced monitoring extensions:
  - `pg_stat_statements` for query performance tracking
  - `pg_buffercache` for memory usage analysis
  - `pg_visibility` for table visibility map analysis
  - `pgstattuple` for tuple statistics
  - `pg_wait_sampling` for wait event sampling
- Automatic configuration through initialization scripts
- Configured with optimized parameters for development use
- Direct access on port 5432

### PgPool (Connection Pooler with Query Cache)

- Connection pooling to reduce database connection overhead
- In-memory query caching for improved performance
- Configuration highlights:
  - Up to 32 children processes
  - 4 connections per child
  - 512MB memory cache for query results
  - Automatic cache invalidation when data changes
  - Support for up to 100,000 cached queries
- Available on port 5433 (separate from PostgreSQL)
- Provides substantial performance improvements for read-heavy workloads

### KeyDB (Redis-Compatible Cache)

- High-performance, Redis-compatible caching layer
- Used by Directus for application-level caching
- Significantly improves CMS performance for repeated operations
- Available on port 6379

## Performance Testing

The environment includes a database performance testing utility:

- `test-cache.ts`: Compare direct PostgreSQL vs. PgPool with caching
  - Tests various query complexities and patterns
  - Measures execution times and improvements
  - Provides recommendations based on your specific workload
  - Run with: `deno run --allow-net test-cache.ts`

## Getting Started

### 1. Set up the network

First, create the shared network that all services will use:

```bash
cd d:\cms
docker compose up -d
```

### 2. Start the database services

Start all database components (PostgreSQL, PgPool, KeyDB) with a single command:

```bash
cd d:\cms\database
.\start-database.bat
```

This script automatically:
- Creates secure credentials if none exist
- Verifies the required network exists
- Starts PostgreSQL, PgPool, and KeyDB in the proper order
- Performs basic health checks

### 3. Start Directus CMS

```bash
cd d:\cms\cms
docker compose up -d
```

### 4. Start the observability stack (optional)

```bash
cd d:\cms\observability
docker compose up -d
```

### 5. Start development utilities (optional)

```bash
cd d:\cms\utilities
docker compose up -d
```

## Access Points

- **Directus CMS**: http://localhost:8055 
- **Database Services**:
  - PostgreSQL: localhost:5432 (user: directus, password: in .env file)
  - PgPool: localhost:5433 (same credentials as PostgreSQL)
  - KeyDB: localhost:6379
- **Observability**:
  - Grafana: http://localhost:3000
  - Prometheus: http://localhost:9090
- **Developer Tools**:
  - PgAdmin: http://localhost:5050
  - MailHog: http://localhost:8025

## Environment Variables

Each component uses environment variables defined in `.env` files. The auto-generated `.env` files contain secure credentials:

### Database Environment Variables
Generated by `start-database.bat` with secure, randomized credentials:
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `PGPOOL_ADMIN_USER`: PgPool admin username
- `PGPOOL_ADMIN_PASSWORD`: PgPool admin password
- `PGPOOL_POSTGRES_USERNAME`: PgPool connection to PostgreSQL username
- `PGPOOL_POSTGRES_PASSWORD`: PgPool connection to PostgreSQL password
- `KEYDB_PASSWORD`: KeyDB password

### CMS Environment Variables
Directus configuration in `cms/config/directus/.env`:
- Database connection settings
- Cache configuration pointing to KeyDB
- Authentication and security settings
- Storage and file handling configuration

## Observability

The environment is fully instrumented with metrics and logs for comprehensive monitoring:

### Metrics Collection

- **PostgreSQL Metrics**: RAM, CPU, query performance, table statistics, buffer cache usage
- **PgPool Metrics**: Connection pooling efficiency, cache hit rates, query performance
- **KeyDB Metrics**: Memory usage, hit rate, connection stats, command execution rates
- **Container Metrics**: CPU, RAM, network, disk usage across all services
- **Custom Application Metrics**: Directus performance and health metrics

### Logging Infrastructure

- Standardized logging format across all services
- Log collection via Promtail
- Aggregation in Loki
- Visualization in Grafana with predefined dashboards
- Configurable log retention periods



