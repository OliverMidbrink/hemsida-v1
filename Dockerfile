FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY public/ ./public/
COPY src/ ./src/
COPY index.html vite.config.js ./

# Build frontend
RUN npm run build

# Node.js server stage
FROM node:18-alpine AS node-server

WORKDIR /app

# Copy package files and install production dependencies for server
COPY server/package.json server/package-lock.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./
COPY --from=frontend-builder /app/dist ./dist

# Python API stage
FROM python:3.10-slim AS python-api

WORKDIR /app

# Install Python dependencies
COPY python-api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python API code
COPY python-api/ ./

# Final stage with Nginx
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist /var/www/html/dist

# Copy Node.js server
COPY --from=node-server /app /node-server

# Copy Python API
COPY --from=python-api /app /python-api

# Install Node.js and Python
RUN apk add --no-cache nodejs npm python3 py3-pip supervisor

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 80 443

# Start supervisor to manage all processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 