# Dockerfile for KarigarSaathi AI Image Studio Microservice
# ------------------------------------------------------------
# Uses a non-root user for security
# Health check verifies service responsiveness
# Production-ready base image

FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install only minimal runtime dependencies
# Security: run as non-root user
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=development \
    APP_DEBUG=False

# Install system dependencies (minimal for headless CV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
# Use --no-cache-dir to minimize image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source code
COPY . .

# Change to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Health check: verify service is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]