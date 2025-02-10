import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Ensure data directory exists
const dataDir = path.join(rootDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create .gitkeep if it doesn't exist
const gitkeepPath = path.join(dataDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
}

// Ensure .env exists
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'ADMIN_EMAIL=oliver.midbrink@gmail.com\n');
}

console.log('Development environment setup complete'); 