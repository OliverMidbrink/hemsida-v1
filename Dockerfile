# Use Node.js as base image
FROM node:18-slim AS builder

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    sqlite3 \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY python-api/requirements.txt ./python-api/

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
RUN npm install
RUN pip install -r python-api/requirements.txt

# Copy project files
COPY . .

# Setup database and run migrations
RUN npm run setup

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 8000
EXPOSE 4173

# Update the start script to use the venv Python
RUN echo '#!/bin/bash\n\
cd python-api && /opt/venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 & \n\
npm run preview' > ./start.sh

RUN chmod +x ./start.sh

# Start both servers
CMD ["./start.sh"] 