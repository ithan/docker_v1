FROM bitnami/pgpool:latest

USER root

# Create the oiddir directory with proper permissions
RUN mkdir -p /bitnami/pgpool/oiddir && \
    chmod -R 777 /bitnami/pgpool/oiddir && \
    chown -R 1001:1001 /bitnami/pgpool/oiddir

USER 1001