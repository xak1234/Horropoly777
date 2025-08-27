// Simple start script for Render deployment
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Horropoly Payment Backend...');

// Try to find the backend file
const possiblePaths = [
  'enhanced-payment-backend.js',
  './enhanced-payment-backend.js',
  path.join(__dirname, 'enhanced-payment-backend.js'),
  '/opt/render/project/src/enhanced-payment-backend.js'
];

let backendFile = null;
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    backendFile = filePath;
    console.log(`✅ Found backend file at: ${backendFile}`);
    break;
  }
}

if (!backendFile) {
  console.error('❌ Could not find enhanced-payment-backend.js');
  console.log('📋 Available files in current directory:');
  try {
    const files = fs.readdirSync('.');
    files.forEach(file => console.log(`  - ${file}`));
  } catch (err) {
    console.error('Error reading directory:', err.message);
  }
  process.exit(1);
}

// Start the backend
console.log(`🎯 Starting backend from: ${backendFile}`);
require(backendFile); 