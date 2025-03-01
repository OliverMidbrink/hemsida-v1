import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory of the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET not found in .env file. Generating a temporary one for development...');
  const crypto = await import('crypto');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.log('Generated temporary JWT_SECRET:', process.env.JWT_SECRET);
}

// Create a temporary .env file for the Python API
const pythonEnvPath = path.join(rootDir, 'python-api', '.env');
fs.writeFileSync(pythonEnvPath, `JWT_SECRET=${process.env.JWT_SECRET}\n`);
console.log('Created temporary .env file for Python API at:', pythonEnvPath);

// Configuration
const config = {
  nodeServer: {
    command: 'npm',
    args: ['run', 'server'],
    name: 'Node.js Server',
    color: '\x1b[36m', // Cyan
    ready: (data) => data.includes('Server running on port')
  },
  pythonServer: {
    command: 'npm',
    args: ['run', 'python-server'],
    name: 'Python API',
    color: '\x1b[35m', // Magenta
    ready: (data) => data.includes('Application startup complete')
  },
  client: {
    command: 'npm',
    args: ['run', 'client'],
    name: 'Vite Client',
    color: '\x1b[32m', // Green
    ready: (data) => data.includes('Local:') && data.includes('http://localhost')
  }
};

// Store process references
const processes = {};

// Function to start a process
function startProcess(key) {
  const { command, args, name, color } = config[key];
  
  console.log(`${color}Starting ${name}...\x1b[0m`);
  
  const proc = spawn(command, args, {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env }
  });
  
  processes[key] = proc;
  
  // Handle stdout
  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${name}] ${output}\x1b[0m`);
      
      // Check if the process is ready
      if (config[key].ready && config[key].ready(output)) {
        console.log(`${color}${name} is ready!\x1b[0m`);
      }
    }
  });
  
  // Handle stderr
  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`${color}[${name} ERROR] ${output}\x1b[0m`);
    }
  });
  
  // Handle process exit
  proc.on('close', (code) => {
    console.log(`${color}${name} exited with code ${code}\x1b[0m`);
    delete processes[key];
    
    // Restart the process if it crashed
    if (code !== 0 && code !== null) {
      console.log(`${color}Restarting ${name}...\x1b[0m`);
      setTimeout(() => startProcess(key), 1000);
    }
  });
  
  return proc;
}

// Function to stop all processes
function stopAllProcesses() {
  console.log('\nStopping all processes...');
  
  Object.entries(processes).forEach(([key, proc]) => {
    const { name, color } = config[key];
    console.log(`${color}Stopping ${name}...\x1b[0m`);
    
    // Different kill methods based on platform
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
    } else {
      proc.kill('SIGTERM');
    }
  });
}

// Start all processes
console.log('\x1b[33m=== Starting Development Environment with Authentication ===\x1b[0m\n');

// Start in sequence: Node.js server first, then Python API, then client
startProcess('nodeServer');

// Wait for Node.js server to start before starting Python API
setTimeout(() => {
  startProcess('pythonServer');
  
  // Wait for Python API to start before starting client
  setTimeout(() => {
    startProcess('client');
  }, 2000);
}, 2000);

// Handle process termination
process.on('SIGINT', stopAllProcesses);
process.on('SIGTERM', stopAllProcesses);

console.log('\n\x1b[33mPress Ctrl+C to stop all processes\x1b[0m'); 