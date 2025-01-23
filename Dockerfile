FROM python:3.10-slim

RUN rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libgl1-mesa-glx \
      libglib2.0-0 \
      ffmpeg \
      curl && \
    rm -rf /var/lib/apt/lists/*
# Set the working directory
WORKDIR /app

# Copy requirements.txt and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy the application code
COPY . /app

# Expose port 80 (Azure Web App will expect this)
EXPOSE 80

# Optional: add a HEALTHCHECK instruction for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost/health || exit 1

# Use Gunicorn to run the application in production; use environment variable PORT if available
CMD ["gunicorn", "--bind", "0.0.0.0:80", "app.api:app", "--timeout", "120"]