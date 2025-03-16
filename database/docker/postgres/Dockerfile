# Start from the official PostgreSQL 17 image
FROM postgres:17
# Set maintainer label
LABEL maintainer="Ithan lara <ithan.lara@prusa3d.cz>"
# Install build dependencies and extension packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        # Build essentials for compiling extensions
        build-essential \
        postgresql-server-dev-17 \
        # For pgvector
        git \
        ca-certificates \
        # For monitoring utilities
        curl \
        # For PostgreSQL connectivity
        libpq-dev \
        # Cleanup to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# Install pgvector extension
RUN cd /tmp \
    && git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector
# Install pg_wait_sampling extension
RUN cd /tmp \
    && git clone https://github.com/postgrespro/pg_wait_sampling.git \
    && cd pg_wait_sampling \
    && make USE_PGXS=1 \
    && make USE_PGXS=1 install \
    && cd .. \
    && rm -rf pg_wait_sampling
# Install auto_explain and other contrib modules
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-contrib-17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && echo "shared_preload_libraries = 'pg_stat_statements,auto_explain,pg_wait_sampling'" >> /usr/share/postgresql/postgresql.conf.sample
# auto_explain is a module that needs to be loaded via shared_preload_libraries
# Create a custom configuration file to enable it
RUN echo "# Enable auto_explain module\n\
shared_preload_libraries = 'pg_stat_statements,auto_explain,pg_wait_sampling'\n\
\n\
# auto_explain configuration\n\
auto_explain.log_min_duration = 500\n\
auto_explain.log_analyze = on\n\
auto_explain.log_buffers = on\n\
auto_explain.log_timing = on\n\
auto_explain.log_triggers = on\n\
auto_explain.log_verbose = on\n\
auto_explain.log_nested_statements = on\n\
\n\
# pg_stat_statements configuration\n\
pg_stat_statements.track = all\n\
pg_stat_statements.max = 10000\n\
track_activity_query_size = 4096\n" > /auto_explain.conf
# Set the default command
CMD ["postgres"]