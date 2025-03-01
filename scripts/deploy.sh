#!/bin/bash

# Exit on error
set -e

# Configuration
APP_DIR="/var/www/html"
NGINX_CONF="/etc/nginx/sites-available/hemsida"
NGINX_ENABLED="/etc/nginx/sites-enabled/hemsida"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Check if JWT_SECRET is set in .env
if ! grep -q "JWT_SECRET" .env; then
  echo -e "${RED}Error: JWT_SECRET not found in .env file${NC}"
  exit 1
fi

# Build the frontend
echo -e "${GREEN}Building frontend...${NC}"
npm run build

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
  echo -e "${GREEN}Creating app directory...${NC}"
  mkdir -p "$APP_DIR"
fi

# Copy built files to app directory
echo -e "${GREEN}Copying files to $APP_DIR...${NC}"
cp -r dist/* "$APP_DIR/"

# Copy .env file to server and Python API directories
echo -e "${GREEN}Copying environment files...${NC}"
cp .env server/
cp .env python-api/

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo -e "${GREEN}Installing PM2...${NC}"
  npm install -g pm2
fi

# Start or restart Node.js server with PM2
echo -e "${GREEN}Starting Node.js server...${NC}"
pm2 start server/index.js --name "node-server" || pm2 restart "node-server"

# Start or restart Python API with PM2
echo -e "${GREEN}Starting Python API...${NC}"
pm2 start "cd python-api && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000" --name "python-api" || pm2 restart "python-api"

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup

# Copy Nginx configuration
echo -e "${GREEN}Configuring Nginx...${NC}"
cp nginx.conf "$NGINX_CONF"

# Create symbolic link if it doesn't exist
if [ ! -f "$NGINX_ENABLED" ]; then
  ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi

# Test Nginx configuration
nginx -t

# Reload Nginx
echo -e "${GREEN}Reloading Nginx...${NC}"
systemctl reload nginx

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Remember to update your domain name in the Nginx configuration.${NC}" 