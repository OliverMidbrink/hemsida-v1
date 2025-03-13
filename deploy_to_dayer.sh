#!/bin/bash

# Configuration
SERVER="dayer"
PROJECT_DIR="~/hemsida"
FRONTEND_DIR="~"
PYTHON_API_DIR="$PROJECT_DIR/python_api"

echo "Starting deployment to $SERVER..."

# SSH into the server and execute commands
ssh $SERVER << 'EOF'
  echo "Connected to server..."
  
  # Create and attach to a screen session for the frontend
  echo "Setting up frontend server..."
  if screen -list | grep -q "web"; then
    echo "Screen 'web' already exists, reattaching and restarting..."
    screen -S web -X quit
  fi
  cd ~
  screen -dmS web bash -c "serve -s dist -l 5173; exec bash"
  echo "Frontend server started in screen 'web'"
  
  # Start the Node.js server with PM2
  echo "Setting up Node.js server..."
  cd ~/hemsida
  pm2 delete my-node-app 2>/dev/null || true
  pm2 start server/index.js --name my-node-app
  echo "Node.js server started with PM2"
  
  # Create and attach to a screen session for the Python API
  echo "Setting up Python API server..."
  if screen -list | grep -q "python-api"; then
    echo "Screen 'python-api' already exists, reattaching and restarting..."
    screen -S python-api -X quit
  fi
  cd ~/hemsida/python-api
  screen -dmS python-api bash -c "uvicorn main:app --host 0.0.0.0 --port 8000; exec bash"
  echo "Python API server started in screen 'python-api'"
  
  # Display status information
  echo "Deployment completed!"
  echo "Screen sessions:"
  screen -list
  echo "PM2 processes:"
  pm2 status
EOF

echo "Deployment script completed." 