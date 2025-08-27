// Debug script to verify deployment environment
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging deployment environment...\n');

// Check current working directory
console.log('📁 Current working directory:', process.cwd());

// List files in current directory
console.log('\n📋 Files in current directory:');
try {
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stats = fs.statSync(file);
    const type = stats.isDirectory() ? '📁' : '📄';
    console.log(`  ${type} ${file}`);
  });
} catch (err) {
  console.error('❌ Error reading directory:', err.message);
}

// Check if enhanced-payment-backend.js exists
console.log('\n🔍 Checking for enhanced-payment-backend.js:');
const backendFile = path.join(process.cwd(), 'enhanced-payment-backend.js');
if (fs.existsSync(backendFile)) {
  console.log('✅ enhanced-payment-backend.js found at:', backendFile);
  const stats = fs.statSync(backendFile);
  console.log('   Size:', stats.size, 'bytes');
  console.log('   Modified:', stats.mtime);
} else {
  console.log('❌ enhanced-payment-backend.js NOT found');
  
  // Check common locations
  const commonPaths = [
    '/opt/render/project/src/enhanced-payment-backend.js',
    '/opt/render/project/src/enhanced-payment-backend.js',
    './enhanced-payment-backend.js',
    '../enhanced-payment-backend.js'
  ];
  
  console.log('\n🔍 Checking common locations:');
  commonPaths.forEach(p => {
    if (fs.existsSync(p)) {
      console.log('✅ Found at:', p);
    } else {
      console.log('❌ Not found at:', p);
    }
  });
}

// Check package.json
console.log('\n📦 Checking package.json:');
const packageFile = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageFile)) {
  console.log('✅ package.json found');
  try {
    const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    console.log('   Main:', packageData.main);
    console.log('   Start script:', packageData.scripts?.start);
  } catch (err) {
    console.error('❌ Error reading package.json:', err.message);
  }
} else {
  console.log('❌ package.json NOT found');
}

// Check environment variables
console.log('\n🌍 Environment variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   PWD:', process.env.PWD);

console.log('\n�� Debug complete!'); 