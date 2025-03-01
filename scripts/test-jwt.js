import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory of the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Read JWT_SECRET from .env file directly if needed
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const match = envContent.match(/JWT_SECRET=(.+)/);
    if (match && match[1]) {
      JWT_SECRET = match[1].trim();
    }
  } catch (error) {
    console.error('Error reading .env file:', error.message);
  }
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET not found in .env file');
  process.exit(1);
}

// Create a test user
const testUser = {
  id: 999,
  email: 'test@example.com',
  is_admin: false
};

// Generate a JWT token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
console.log('Generated JWT token:');
console.log(token);

// Test the token with the Node.js API
const testNodeApi = async () => {
  try {
    const response = await fetch('http://localhost:3001/user-api/verify-token', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Node.js API verification successful:');
      console.log(data);
    } else {
      console.error('Node.js API verification failed:', response.status);
      const error = await response.text();
      console.error(error);
    }
  } catch (error) {
    console.error('Error testing Node.js API:', error.message);
  }
};

// Test the token with the Python API
const testPythonApi = async () => {
  try {
    const response = await fetch('http://localhost:8000/data-api/jobs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Python API verification successful:');
      console.log(data);
    } else {
      console.error('Python API verification failed:', response.status);
      const error = await response.text();
      console.error(error);
    }
  } catch (error) {
    console.error('Error testing Python API:', error.message);
  }
};

// Run the tests
const runTests = async () => {
  console.log('Testing JWT authentication...');
  
  console.log('\n1. Testing Node.js API:');
  await testNodeApi();
  
  console.log('\n2. Testing Python API:');
  await testPythonApi();
};

runTests(); 