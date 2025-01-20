# Use a slim Python 3.10 image as base
FROM python:3.10-slim

# Install system dependencies for OpenCV, MediaPipe, etc.
RUN apt-get update && \
    apt-get install -y build-essential libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy requirements.txt and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# Expose the port your app runs on (our Flask app listens on 5000)
EXPOSE 5001

# Use Gunicorn to run the application in production
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app.api:app"]