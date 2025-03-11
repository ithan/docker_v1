# CMS Development Environment with Full Observability

This setup provides a complete development environment for Directus CMS with a full observability stack.

## Components

- **Directus**: Latest version running on its own container
- **PostgreSQL 17**: With pgvector extension for vector search capabilities
- **KeyDB**: High-performance Redis alternative
- **Observability Stack**:
  - Prometheus: Metrics collection and storage
  - Grafana: Visualization and dashboards
  - Loki: Log aggregation
  - Promtail: Log collector
  - Various exporters for PostgreSQL, KeyDB, and system metrics

## Getting Started

1. Create all the required directories:

```bash
mkdir -p data/{directus/{uploads,extensions,config},postgres,keydb,prometheus,loki,grafana,pgadmin} config/{postgres/{init},keydb,prometheus,loki,promtail,grafana/provisioning/{datasources,dashboards}} compose
```

2. Copy all configuration files to their respective directories.

3. Update the `.env` file with secure credentials.

4. Start the environment:

```bash
docker-compose up -d
```

## Access Points

- Directus: http://localhost:8055
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- PgAdmin: http://localhost:5050

## Monitoring

The environment is fully instrumented with metrics and logs for all components:

- PostgreSQL metrics: RAM, CPU, query performance, table statistics
- KeyDB metrics: Memory usage, hit rate, connection stats
- Container metrics: CPU, RAM, network, disk usage
- Log aggregation: All logs are collected and available in Grafana via Loki
