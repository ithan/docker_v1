# CMS Development Environment with Full Observability

This setup provides a complete development environment for Directus CMS with a full observability stack. Each component can be started independently as needed.

## Project Structure

```
root\
├── .env                        # Main environment variables
├── docker-compose.yml          # Root compose file (network only)
├── utils\                      # Reusable Docker configurations
│   ├── logging.yml             # Shared logging configuration
│   ├── healthchecks.yml        # Shared healthcheck definitions
├── database\                   # Database services
│   ├── docker-compose.yml      # PostgreSQL compose file
│   ├── config\...              # PostgreSQL configuration
│   ├── data\...                # PostgreSQL data
│   ├── cache\                  # Cache services
│       ├── docker-compose.yml  # KeyDB compose file
│       ├── config\...          # KeyDB configuration
│       ├── data\...            # KeyDB data
├── cms\                        # CMS services
│   ├── docker-compose.yml      # Directus compose file
│   ├── config\...              # Directus configuration
│   ├── data\...                # Directus data
├── observability\              # Monitoring stack
│   ├── docker-compose.yml      # Observability compose file
│   ├── config\...              # Prometheus, Grafana, etc. configuration
│   ├── data\...                # Monitoring data
├── utilities\                  # Development tools
│   ├── docker-compose.yml      # Utilities compose file
│   ├── data\...                # Utilities data
```

## Getting Started

1. First, set up the network:

```bash
cd d:\cms
docker compose up -d
```

2. Start the PostgreSQL database:

```bash
cd d:\cms\database
docker compose up -d
```

3. Start the KeyDB cache:

```bash
cd d:\cms\database\cache
docker compose up -d
```

4. Start Directus CMS:

```bash
cd d:\cms\cms
docker compose up -d
```

5. Start the observability stack (optional):

```bash
cd d:\cms\observability
docker compose up -d
```

6. Start development utilities (optional):

```bash
cd d:\cms\utilities
docker compose up -d
```

## Access Points

- Directus: http://localhost:8055
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- PgAdmin: http://localhost:5050
- MailHog: http://localhost:8025

## Environment Variables

Each component uses environment variables defined in `.env` files. The root `.env` contains common variables, but you can create specific `.env` files in each component directory to override them.

## Monitoring

The environment is fully instrumented with metrics and logs for all components:

- PostgreSQL metrics: RAM, CPU, query performance, table statistics
- KeyDB metrics: Memory usage, hit rate, connection stats
- Container metrics: CPU, RAM, network, disk usage
- Log aggregation: All logs are collected and available in Grafana via Loki
