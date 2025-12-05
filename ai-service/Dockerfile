# ===============================================
# AI Service Dockerfile
# ===============================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies INCLUDING CURL (critical for health checks)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8003

# Health check - Simple curl command
# Increased start_period to 120s to ensure service is fully ready
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=120s \
            --retries=5 \
            CMD curl -f http://localhost:8003/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--log-level", "info"]