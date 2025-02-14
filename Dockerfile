# Use Node.js as base image
FROM node:18-slim as builder

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY python-api/requirements.txt ./python-api/

# Install dependencies
RUN npm install
RUN pip3 install -r python-api/requirements.txt

# Copy project files
COPY . .

# Setup database and run migrations
RUN npm run setup

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 8000
EXPOSE 5173

# Create start script
RUN echo '#!/bin/bash\n\
npm run python-server & \n\
npm run preview' > ./start.sh

RUN chmod +x ./start.sh

# Start both servers
CMD ["./start.sh"] 