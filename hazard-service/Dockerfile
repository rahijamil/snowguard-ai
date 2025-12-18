# ===============================================
# Hazard Service Dockerfile
# ===============================================

FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/hazard-service-*.jar app.jar
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8082
HEALTHCHECK CMD curl -f http://localhost:8082/api/hazards/health || exit 1
ENTRYPOINT ["java","-jar","/app/app.jar"]
