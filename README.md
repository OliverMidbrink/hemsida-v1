# Personal Website with JWT Authentication

This project consists of a frontend application, a Node.js authentication server, and a Python API for data handling.

## Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hemsida
   ```

2. Install dependencies:
   ```bash
   npm install
   cd python-api
   pip install -r requirements.txt
   cd ..
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   JWT_SECRET=your_secure_jwt_secret
   ```

4. Start the development servers:
   ```bash
   # Terminal 1: Start the Node.js server
   node server/index.js
   
   # Terminal 2: Start the Python API
   cd python-api
   python -m uvicorn main:app --reload
   
   # Terminal 3: Start the frontend development server
   npm run dev
   ```

## Production Deployment

### Option 1: Traditional Deployment

1. Make sure you have Nginx installed on your server:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Install Node.js and Python on your server.

3. Copy the project files to your server.

4. Run the deployment script:
   ```bash
   sudo bash scripts/deploy.sh
   ```

5. The script will:
   - Build the frontend
   - Copy files to the appropriate directories
   - Set up PM2 for process management
   - Configure Nginx
   - Start all services

### Option 2: Docker Deployment

1. Make sure you have Docker and Docker Compose installed on your server:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   ```

2. Copy the project files to your server.

3. Create an SSL directory and add your SSL certificates:
   ```bash
   mkdir -p ssl
   # Copy your certificate.crt and private.key files to the ssl directory
   ```

4. Create a `.env` file with your environment variables.

5. Build and start the Docker containers:
   ```bash
   docker-compose up -d
   ```

## SSL Configuration

For production deployment, you need to obtain SSL certificates. You can use Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Update the Nginx configuration with the paths to your SSL certificates.

## Security Considerations

- The JWT secret should be a strong, random string.
- All API endpoints that require authentication are protected with JWT verification.
- HTTPS is enforced in production to protect data in transit.
- WebSocket connections are authenticated using JWT tokens.

## Maintenance

- To update the application:
  ```bash
  git pull
  sudo bash scripts/deploy.sh
  ```

- To view logs:
  ```bash
  # For Node.js server
  pm2 logs node-server
  
  # For Python API
  pm2 logs python-api
  
  # For Nginx
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

## Troubleshooting

- If you encounter issues with Nginx, check the configuration:
  ```bash
  sudo nginx -t
  ```

- If services aren't starting, check the PM2 status:
  ```bash
  pm2 status
  ```

- For Docker deployment issues, check the container logs:
  ```bash
  docker-compose logs
  ```



