# ===============================================
# API Gateway Dockerfile
# ===============================================

FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Build application
RUN apt-get update && apt-get install -y maven && \
    mvn clean package -DskipTests && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ===============================================
# Runtime Stage
# ===============================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install curl for health checks and wait-for-it script
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy JAR from builder
COPY --from=builder /app/target/api-gateway-*.jar app.jar

# Create non-root user
RUN useradd -m -u 1000 gateway && chown -R gateway:gateway /app
USER gateway

# Wait for config-service to be available before starting
COPY wait-for-config.sh /usr/local/bin/wait-for-config.sh
USER root
RUN chmod +x /usr/local/bin/wait-for-config.sh
USER gateway

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/gateway/status || exit 1

# Run application
ENTRYPOINT ["/usr/local/bin/wait-for-config.sh"]