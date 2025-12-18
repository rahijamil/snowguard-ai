# ===============================================
# User Service Dockerfile
# ===============================================

# ===============================================
# Build Stage
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

COPY --from=builder /app/target/user-service-*.jar app.jar

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8081

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
