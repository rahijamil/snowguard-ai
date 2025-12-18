# ===== Notification Service Dockerfile =====

FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy application code
COPY . .

# Create non-root user with UID 1001 (different from base image's user)
RUN adduser -D -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8004

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]